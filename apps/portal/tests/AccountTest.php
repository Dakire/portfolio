<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\UserRepository;
use OTPHP\TOTP;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\Mime\Email;

/** Comptes clients : inscription, confirmation de l'adresse, mot de passe oublié, double authentification, RGPD. */
final class AccountTest extends PortalTestCase
{
    private const NEW_PASSWORD = 'une autre phrase de passe';

    public function testRegistrationNeedsAConfirmedAddressBeforeLogin(): void
    {
        $client = $this->migratedClient();
        $this->register($client, 'Nouveau@Example.org');
        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('main', 'Consultez votre messagerie');
        self::assertEmailCount(1);
        $link = $this->linkIn($this->lastEmail(), '/verifier/');

        // Mot de passe correct mais adresse non confirmée : refus explicite
        $this->login($client, 'nouveau@example.org', self::PASSWORD);
        self::assertSelectorTextContains('[role=alert]', 'Confirmez d\'abord votre adresse');

        // Le lien ouvert par GET n'a pas d'effet (antivirus de messagerie) ; la confirmation se fait par le bouton
        $client->request('GET', $link);
        self::assertResponseIsSuccessful();
        self::assertFalse($this->user('nouveau@example.org')->isVerified());
        $client->submitForm('Confirmer mon adresse');
        self::assertResponseRedirects('/login');
        self::assertTrue($this->user('nouveau@example.org')->isVerified());

        // Lien à usage unique
        $client->request('GET', $link);
        self::assertSelectorTextContains('[role=alert]', 'Lien expiré ou déjà utilisé');

        $this->login($client, 'nouveau@example.org', self::PASSWORD);
        self::assertResponseRedirects('/');
    }

    public function testRegistrationNeverRevealsAnExistingAccount(): void
    {
        $client = $this->migratedClient();
        $this->createUser('deja@example.org');
        $this->register($client, 'deja@example.org');
        self::assertSelectorTextContains('main', 'Consultez votre messagerie');
        self::assertEmailCount(1);
        self::assertStringContainsString('Vous avez déjà un compte', (string) $this->lastEmail()->getSubject());
        self::assertSame(1, $this->service(UserRepository::class)->count([]));
    }

    public function testRegistrationValidatesInputAndCsrf(): void
    {
        $client = $this->migratedClient();
        $this->register($client, 'court@example.org', 'trop court');
        self::assertResponseStatusCodeSame(422);
        self::assertSelectorTextContains('[role=alert]', '12 caractères');
        $client->request('POST', '/inscription', ['email' => 'x@example.org', 'password' => self::PASSWORD, 'password_confirm' => self::PASSWORD, 'terms' => '1', '_token' => 'faux']);
        self::assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->service(UserRepository::class)->count([]));
        self::assertEmailCount(0);
    }

    public function testPasswordResetIsSingleUseAndAnswersTheSameForUnknownAddresses(): void
    {
        $client = $this->migratedClient();
        $this->createUser('moi@example.org');

        $client->request('GET', '/mot-de-passe-oublie');
        $client->submitForm('Envoyer le lien', ['email' => 'inconnu@example.org']);
        $unknownAnswer = $client->getCrawler()->filter('main')->text();
        self::assertEmailCount(0);

        $client->request('GET', '/mot-de-passe-oublie');
        $client->submitForm('Envoyer le lien', ['email' => 'moi@example.org']);
        self::assertEmailCount(1);
        self::assertSame(
            str_replace('inconnu@example.org', 'X', $unknownAnswer),
            str_replace('moi@example.org', 'X', $client->getCrawler()->filter('main')->text()),
            'même réponse pour une adresse connue ou non',
        );

        $link = $this->linkIn($this->lastEmail(), '/reinitialiser/');
        $client->request('GET', $link);
        $client->submitForm('Enregistrer', ['password' => self::NEW_PASSWORD, 'password_confirm' => self::NEW_PASSWORD]);
        self::assertResponseRedirects('/login');
        $client->request('GET', $link);
        self::assertResponseStatusCodeSame(410);

        $this->login($client, 'moi@example.org', self::PASSWORD);
        self::assertSelectorExists('[role=alert]');
        $this->login($client, 'moi@example.org', self::NEW_PASSWORD);
        self::assertResponseRedirects('/');
    }

    public function testTwoFactorEnrolmentLoginAndBackupCodes(): void
    {
        $client = $this->migratedClient();
        $this->createUser('2fa@example.org');
        $this->login($client, '2fa@example.org', self::PASSWORD);
        $client->followRedirect();

        $crawler = $client->request('GET', '/compte/double-authentification');
        self::assertResponseIsSuccessful();
        self::assertStringStartsWith('data:image/svg+xml;base64,', (string) $crawler->filter('.portal-qr')->attr('src'));
        $secret = str_replace(' ', '', $crawler->filter('.portal-secret')->text());
        if ('' === $secret) {
            self::fail('clé TOTP absente de la page');
        }
        $now = TOTP::createFromSecret($secret)->now();

        $client->submitForm('Activer', ['code' => '000000' === $now ? '111111' : '000000']);
        self::assertResponseStatusCodeSame(422);
        $crawler = $client->submitForm('Activer', ['code' => TOTP::createFromSecret($secret)->now()]);
        self::assertResponseIsSuccessful();
        $codes = $crawler->filter('.portal-codes code')->each(static fn($c): string => $c->text());
        self::assertCount(10, $codes);
        self::assertTrue($this->user('2fa@example.org')->isTotpAuthenticationEnabled());

        // Nouvelle connexion : le mot de passe ne suffit plus
        $client->request('GET', '/logout');
        $this->login($client, '2fa@example.org', self::PASSWORD);
        $this->followAll($client);
        self::assertSelectorTextContains('h1', 'Code de vérification');
        $client->request('GET', '/compte');
        self::assertResponseRedirects('/2fa');

        $client->request('GET', '/2fa');
        $client->submitForm('Valider', ['_auth_code' => '999999']);
        $this->followAll($client);
        self::assertSelectorTextContains('[role=alert]', 'Ce code n\'est pas valable');

        // Un code de secours, saisi sans tiret et en capitales, fonctionne une fois
        // (retour vers la page demandée avant le code : /compte)
        $client->submitForm('Valider', ['_auth_code' => strtoupper(str_replace('-', '', $codes[0]))]);
        $this->followAll($client);
        self::assertSelectorTextContains('h1', 'Compte');
        self::assertSame(9, $this->user('2fa@example.org')->countBackupCodes());
    }

    public function testExportGivesTheAccountDataWithoutSecrets(): void
    {
        $client = $this->migratedClient();
        $user = $this->createUser('export@example.org');
        $client->loginUser($user);
        $crawler = $client->request('GET', '/compte');
        $client->submit($crawler->selectButton('Télécharger mes données (JSON)')->form());
        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Disposition', 'attachment; filename="espace-client-grichard-eu.json"');
        $json = (string) $client->getResponse()->getContent();
        $data = json_decode($json, true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($data);
        self::assertSame('export@example.org', $data['compte']['email'] ?? null);
        self::assertStringNotContainsString($user->getPassword(), $json);
    }

    public function testAccountDeletionNeedsThePasswordAndKeepsTheLastAdmin(): void
    {
        $client = $this->migratedClient();
        $client->loginUser($this->createUser('admin@example.org', ['ROLE_ADMIN']));
        $client->request('GET', '/compte/supprimer');
        $client->submitForm('Supprimer définitivement', ['current_password' => self::PASSWORD, 'confirm' => '1']);
        self::assertSelectorTextContains('[role=alert]', 'dernier administrateur');

        $client->loginUser($this->createUser('client@example.org'));
        $client->request('GET', '/compte/supprimer');
        $client->submitForm('Supprimer définitivement', ['current_password' => 'mauvais', 'confirm' => '1']);
        self::assertResponseStatusCodeSame(422);
        $client->submitForm('Supprimer définitivement', ['current_password' => self::PASSWORD, 'confirm' => '1']);
        self::assertResponseRedirects('/login');
        $this->service(EntityManagerInterface::class)->clear();
        self::assertNull($this->service(UserRepository::class)->findByEmail('client@example.org'));
        $client->request('GET', '/compte');
        self::assertResponseRedirects('http://localhost/login');
    }

    private function register(KernelBrowser $client, string $email, string $password = self::PASSWORD): void
    {
        $client->request('GET', '/inscription');
        $client->submitForm('Créer le compte', ['email' => $email, 'password' => $password, 'password_confirm' => $password, 'terms' => '1']);
    }

    private function login(KernelBrowser $client, string $email, string $password): void
    {
        $client->request('GET', '/login');
        $client->submitForm('Se connecter', ['_username' => $email, '_password' => $password]);
        // Échec : retour au formulaire (URL absolue), suivi pour lire le message ; succès : redirection laissée au test
        if (str_ends_with((string) $client->getResponse()->headers->get('Location'), '/login')) {
            $client->followRedirect();
        }
    }

    private function followAll(KernelBrowser $client): void
    {
        while ($client->getResponse()->isRedirection()) {
            $client->followRedirect();
        }
    }

    private function lastEmail(): Email
    {
        $message = self::getMailerMessage(\count(self::getMailerMessages()) - 1);
        self::assertInstanceOf(Email::class, $message);

        return $message;
    }

    private function linkIn(Email $email, string $path): string
    {
        if (1 !== preg_match('#https?://[^\s]+' . preg_quote($path, '#') . '[A-Za-z0-9_-]+#', (string) $email->getTextBody(), $m)) {
            self::fail('lien ' . $path . ' attendu dans l\'e-mail');
        }

        return (string) parse_url($m[0], \PHP_URL_PATH);
    }

    private function user(string $email): User
    {
        $this->service(EntityManagerInterface::class)->clear();
        $user = $this->service(UserRepository::class)->findByEmail($email);
        self::assertInstanceOf(User::class, $user);

        return $user;
    }
}
