<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\Licence;
use Grichard\Portal\Licence\LicenceSigner;
use Grichard\Portal\Paddle\WebhookVerifier;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Shop\LicenceIssuer;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

/** Lot 3 : notifications Paddle, licences signées, API des produits, téléchargements, pages client et administration. */
final class ShopFlowTest extends PortalTestCase
{
    public function testLicenceTokensAreSignedAndTamperProof(): void
    {
        $this->migratedClient();
        $licence = $this->service(LicenceIssuer::class)->issue('a@example.org', null, 'prevenez-moi-rupture', 'licence');
        self::assertInstanceOf(Licence::class, $licence);
        self::assertMatchesRegularExpression('/^GR(-[A-Z0-9]{4}){4}$/', $licence->getKey());
        $signer = $this->service(LicenceSigner::class);
        $token = $signer->token($licence);

        $payload = $signer->verify($token);
        self::assertSame($licence->getKey(), $payload['lic'] ?? null);
        self::assertSame('prevenez-moi-rupture', $payload['prod'] ?? null);
        self::assertArrayHasKey('exp', $payload);
        self::assertNull($payload['exp'], 'licence perpétuelle : pas d\'échéance');
        self::assertIsInt($payload['upd'] ?? null, 'un an de mises à jour');
        self::assertStringNotContainsString('a@example.org', (string) base64_decode(strtr(explode('.', $token)[1], '-_', '+/')), 'aucune donnée personnelle dans le jeton');

        // Une charge utile modifiée (autre produit) ne passe plus la vérification
        [$prefix, $body, $signature] = explode('.', $token);
        $forged = json_decode((string) base64_decode(strtr($body, '-_', '+/')), true);
        self::assertIsArray($forged);
        $forged['prod'] = 'standup-slack';
        $forgedBody = rtrim(strtr(base64_encode((string) json_encode($forged)), '+/', '-_'), '=');
        self::assertNull($signer->verify($prefix . '.' . $forgedBody . '.' . $signature));
        self::assertNull($signer->verify('n\'importe quoi'));
    }

    public function testWebhookRejectsBadSignaturesAndHandlesEachEventOnce(): void
    {
        $client = $this->migratedClient();
        $buyer = $this->createUser('client@example.org');
        $event = $this->transaction('evt_1', 'txn_1', 'pri_test_module', ['user_id' => $buyer->getId()]);

        $client->request('POST', '/webhooks/paddle', server: ['HTTP_PADDLE_SIGNATURE' => 'ts=' . time() . ';h1=faux'], content: $event);
        self::assertResponseStatusCodeSame(403);
        $old = time() - 3600;
        $client->request('POST', '/webhooks/paddle', server: ['HTTP_PADDLE_SIGNATURE' => $this->service(WebhookVerifier::class)->sign($event, $old)], content: $event);
        self::assertResponseStatusCodeSame(403, 'notification trop ancienne : rejeu refusé');

        $this->deliver($client, $event);
        self::assertResponseIsSuccessful();
        $this->deliver($client, $event);
        self::assertResponseIsSuccessful();
        self::assertSame('déjà traité', json_decode((string) $client->getResponse()->getContent(), true)['resultat'] ?? null);

        $licences = $this->licences()->findBy(['paddleTransactionId' => 'txn_1']);
        self::assertCount(1, $licences, 'une seule licence malgré la notification reçue deux fois');
        self::assertSame($buyer->getId(), $licences[0]->getUser()?->getId());
        self::assertNull($licences[0]->getValidUntil());
    }

    public function testRefundRevokesAndUpdatesPurchaseExtendsWithoutBeingRevokedByItsOwnRefund(): void
    {
        $client = $this->migratedClient();
        $this->deliver($client, $this->transaction('evt_a', 'txn_a', 'pri_test_module', ['email' => 'Achat@Example.org']));
        $licence = $this->licences()->findBy(['paddleTransactionId' => 'txn_a'])[0] ?? null;
        self::assertInstanceOf(Licence::class, $licence);
        self::assertNull($licence->getUser(), 'achat sans compte : licence en attente de rattachement');
        $updatesBefore = $licence->getUpdatesUntil();

        // Prolongation des mises à jour, puis son remboursement : la licence reste valable
        $this->deliver($client, $this->transaction('evt_b', 'txn_b', 'pri_test_module_maj', ['email' => 'achat@example.org']));
        $this->deliver($client, $this->adjustment('evt_c', 'txn_b'));
        $licence = $this->reload($licence);
        self::assertGreaterThan($updatesBefore, $licence->getUpdatesUntil());
        self::assertTrue($licence->isUsable());

        // Remboursement de l'achat lui-même : licence révoquée
        $this->deliver($client, $this->adjustment('evt_d', 'txn_a'));
        self::assertSame(Licence::REVOKED, $this->reload($licence)->getStatus());
    }

    public function testSubscriptionLicenceFollowsTheBillingPeriodAndCancellation(): void
    {
        $client = $this->migratedClient();
        $end = new \DateTimeImmutable('+1 year');
        $this->deliver($client, $this->transaction('evt_s1', 'txn_s1', 'pri_test_youtube_pro', ['email' => 'abo@example.org'], 'sub_1', $end));
        $licence = $this->licences()->findBy(['paddleSubscriptionId' => 'sub_1'])[0] ?? null;
        self::assertInstanceOf(Licence::class, $licence);
        self::assertSame($end->getTimestamp(), $licence->getValidUntil()?->getTimestamp());

        $this->deliver($client, (string) json_encode([
            'event_id' => 'evt_s2',
            'event_type' => 'subscription.canceled',
            'data' => ['id' => 'sub_1', 'status' => 'canceled', 'current_billing_period' => ['ends_at' => $end->format(\DATE_ATOM)]],
        ]));
        $licence = $this->reload($licence);
        self::assertSame(Licence::CANCELLED, $licence->getStatus());
        self::assertTrue($licence->isUsable(), 'résiliée mais valable jusqu\'à la fin de la période payée');
    }

    public function testProductApiRefreshesTokensAndServesCoveredUpdatesThroughSignedLinks(): void
    {
        $client = $this->migratedClient();
        $licence = $this->service(LicenceIssuer::class)->issue('api@example.org', null, 'prevenez-moi-rupture', 'licence');
        self::assertInstanceOf(Licence::class, $licence);
        $token = $this->service(LicenceSigner::class)->token($licence);
        $this->publish('prevenez-moi-rupture', '1.2.0', 'contenu du module');

        $client->request('GET', '/api/licence/cle-publique');
        self::assertResponseIsSuccessful();
        self::assertSame('Ed25519', json_decode((string) $client->getResponse()->getContent(), true)['alg'] ?? null);

        $client->request('POST', '/api/licence/renouveler', server: ['HTTP_AUTHORIZATION' => 'Licence ' . $token]);
        self::assertResponseIsSuccessful();
        $client->request('POST', '/api/licence/renouveler', server: ['HTTP_AUTHORIZATION' => 'Licence GRL1.faux.faux']);
        self::assertResponseStatusCodeSame(401);

        $client->request('GET', '/api/mises-a-jour/prevenez-moi-rupture', server: ['HTTP_AUTHORIZATION' => 'Licence ' . $token]);
        self::assertResponseIsSuccessful();
        $answer = json_decode((string) $client->getResponse()->getContent(), true);
        self::assertIsArray($answer);
        self::assertSame('1.2.0', $answer['version']);
        $link = (string) parse_url((string) $answer['telechargement'], \PHP_URL_PATH) . '?' . parse_url((string) $answer['telechargement'], \PHP_URL_QUERY);

        $client->request('GET', $link);
        self::assertResponseIsSuccessful();
        $client->request('GET', str_replace('sig=', 'sig=0', $link));
        self::assertResponseStatusCodeSame(403, 'lien modifié refusé');

        // Jeton d'un autre produit : refusé
        $client->request('GET', '/api/mises-a-jour/standup-slack', server: ['HTTP_AUTHORIZATION' => 'Licence ' . $token]);
        self::assertResponseStatusCodeSame(401);

        // Licence révoquée : plus de renouvellement
        $licence = $this->reload($licence);
        $licence->revoke();
        $this->service(EntityManagerInterface::class)->flush();
        $client->request('POST', '/api/licence/renouveler', server: ['HTTP_AUTHORIZATION' => 'Licence ' . $token]);
        self::assertResponseStatusCodeSame(410);
    }

    public function testCustomerSeesOnlyOwnLicencesAndAdminCanGrantAndRevoke(): void
    {
        $client = $this->migratedClient();
        $owner = $this->createUser('owner@example.org');
        $other = $this->createUser('other@example.org');
        $licence = $this->service(LicenceIssuer::class)->issue('owner@example.org', $owner, 'prevenez-moi-rupture', 'licence');
        self::assertInstanceOf(Licence::class, $licence);
        $this->publish('prevenez-moi-rupture', '1.0.0', 'v1');

        $client->loginUser($owner);
        $client->request('GET', '/licences');
        self::assertSelectorTextContains('main', $licence->getKey());
        $client->request('GET', '/licences/' . $licence->getKey() . '/jeton');
        self::assertResponseIsSuccessful();
        self::assertStringStartsWith('GRL1.', (string) $client->getResponse()->getContent());
        $client->request('GET', '/licences/' . $licence->getKey() . '/telecharger/1.0.0');
        self::assertResponseIsSuccessful();

        $client->loginUser($other);
        $client->request('GET', '/licences/' . $licence->getKey() . '/jeton');
        self::assertResponseStatusCodeSame(404, 'la licence d\'un autre client n\'existe pas pour vous');

        $client->loginUser($this->createUser('admin@example.org', ['ROLE_ADMIN']));
        $client->request('GET', '/admin/licences');
        $client->submitForm('Attribuer', ['email' => 'other@example.org', 'offer' => 'youtube-regarder-plus-tard/pro-a-vie']);
        self::assertResponseRedirects('/admin/licences');
        $granted = $this->licences()->findOneBy(['email' => 'other@example.org']);
        self::assertInstanceOf(Licence::class, $granted);
        self::assertSame($other->getId(), $granted->getUser()?->getId());

        $client->followRedirect();
        $client->submitForm('Révoquer ' . $granted->getKey());
        self::assertSame(Licence::REVOKED, $this->reload($granted)->getStatus());
    }

    public function testPurchaseBeforeRegistrationIsAttachedOnceTheAddressIsConfirmed(): void
    {
        $client = $this->migratedClient();
        $this->deliver($client, $this->transaction('evt_p', 'txn_p', 'pri_test_module', ['email' => 'plus-tard@example.org']));
        $client->request('GET', '/inscription');
        $client->submitForm('Créer le compte', ['email' => 'plus-tard@example.org', 'password' => self::PASSWORD, 'password_confirm' => self::PASSWORD, 'terms' => '1']);
        $message = self::getMailerMessage(0);
        self::assertInstanceOf(\Symfony\Component\Mime\Email::class, $message);
        preg_match('#/verifier/[A-Za-z0-9_-]+#', (string) $message->getTextBody(), $m);
        $client->request('GET', $m[0] ?? '/verifier/absent');
        $client->submitForm('Confirmer mon adresse');
        $licence = $this->licences()->findBy(['paddleTransactionId' => 'txn_p'])[0] ?? null;
        self::assertInstanceOf(Licence::class, $licence);
        self::assertSame('plus-tard@example.org', $this->reload($licence)->getUser()?->getEmail());
    }

    // ---- outils ----

    /** @param array<string, mixed> $custom */
    private function transaction(string $eventId, string $transactionId, string $priceId, array $custom, ?string $subscriptionId = null, ?\DateTimeImmutable $periodEnd = null): string
    {
        return (string) json_encode([
            'event_id' => $eventId,
            'event_type' => 'transaction.completed',
            'occurred_at' => new \DateTimeImmutable()->format(\DATE_ATOM),
            'data' => [
                'id' => $transactionId,
                'status' => 'completed',
                'customer_id' => 'ctm_test',
                'subscription_id' => $subscriptionId,
                'custom_data' => $custom,
                'items' => [['price' => ['id' => $priceId], 'quantity' => 1]],
                'billing_period' => null === $periodEnd ? null : ['starts_at' => new \DateTimeImmutable()->format(\DATE_ATOM), 'ends_at' => $periodEnd->format(\DATE_ATOM)],
            ],
        ]);
    }

    private function adjustment(string $eventId, string $transactionId): string
    {
        return (string) json_encode([
            'event_id' => $eventId,
            'event_type' => 'adjustment.updated',
            'data' => ['id' => 'adj_' . $eventId, 'action' => 'refund', 'status' => 'approved', 'transaction_id' => $transactionId],
        ]);
    }

    private function deliver(KernelBrowser $client, string $body): void
    {
        $client->request('POST', '/webhooks/paddle', server: [
            'HTTP_PADDLE_SIGNATURE' => $this->service(WebhookVerifier::class)->sign($body, time()),
            'CONTENT_TYPE' => 'application/json',
        ], content: $body);
        self::assertResponseIsSuccessful();
    }

    private function publish(string $product, string $version, string $content): void
    {
        $dir = (string) $_SERVER['PORTAL_VAR_DIR'] . '/downloads/' . $product;
        if (!is_dir($dir)) {
            mkdir($dir, 0o777, true);
        }
        file_put_contents($dir . '/' . $product . '-' . $version . '.zip', $content);
    }

    private function licences(): LicenceRepository
    {
        $this->service(EntityManagerInterface::class)->clear();

        return $this->service(LicenceRepository::class);
    }

    private function reload(Licence $licence): Licence
    {
        $fresh = $this->licences()->find($licence->getId());
        self::assertInstanceOf(Licence::class, $fresh);

        return $fresh;
    }
}
