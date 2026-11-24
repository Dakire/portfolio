<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use chillerlan\QRCode\Output\QROutputInterface;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Account\AccountMailer;
use Grichard\Portal\Account\PasswordPolicy;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Repository\UserRepository;
use OTPHP\TOTP;
use Psr\Log\LoggerInterface;
use Scheb\TwoFactorBundle\Security\TwoFactor\Provider\Totp\TotpAuthenticatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/** Compte du client : mot de passe, double authentification, codes de secours, export et suppression des données (RGPD). */
#[Route('/compte')]
final class AccountController extends AbstractController
{
    private const PENDING_SECRET = 'totp_pending_secret';
    private const BACKUP_CODE_COUNT = 10;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $hasher,
        #[Autowire(service: 'monolog.logger.portal')]
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('', name: 'app_account', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('account/index.html.twig', ['user' => $this->user()]);
    }

    #[Route('/mot-de-passe', name: 'app_account_password', methods: ['GET', 'POST'])]
    public function password(Request $request, AccountMailer $mailer): Response
    {
        $user = $this->user();
        $error = null;
        if ($request->isMethod('POST')) {
            $this->requireCsrf('account_password', $request);
            $password = (string) $request->request->get('password');
            if (!$this->hasher->isPasswordValid($user, (string) $request->request->get('current_password'))) {
                $error = 'Mot de passe actuel incorrect.';
            } elseif (null === ($error = PasswordPolicy::check($password, (string) $request->request->get('password_confirm')))) {
                $user->setPassword($this->hasher->hashPassword($user, $password));
                $this->entityManager->flush();
                $mailer->passwordChanged($user);
                $this->logger->info('mot de passe modifié', ['user' => $user->getId()]);
                $this->addFlash('success', 'Mot de passe modifié.');

                return $this->redirectToRoute('app_account');
            }
        }

        return $this->render(
            'account/password.html.twig',
            ['error' => $error, 'min_length' => PasswordPolicy::MIN_LENGTH],
            new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK)
        );
    }

    /** Activation en deux temps : un secret est proposé (QR code), il n'est enregistré qu'après la saisie d'un code valide. */
    #[Route('/double-authentification', name: 'app_account_2fa', methods: ['GET', 'POST'])]
    public function enableTwoFactor(Request $request, TotpAuthenticatorInterface $totp): Response
    {
        $user = $this->user();
        if ($user->isTotpAuthenticationEnabled()) {
            return $this->redirectToRoute('app_account');
        }
        $session = $request->getSession();
        $secret = $session->get(self::PENDING_SECRET);
        if (!\is_string($secret) || '' === $secret) {
            $secret = $totp->generateSecret();
            $session->set(self::PENDING_SECRET, $secret);
        }
        $error = null;
        if ($request->isMethod('POST')) {
            $this->requireCsrf('account_2fa', $request);
            $code = preg_replace('/\s+/', '', (string) $request->request->get('code')) ?? '';
            if (1 === preg_match('/^\d{6}$/', $code) && $this->totpFor($user, $secret)->verify($code, null, 1)) {
                $codes = $this->newBackupCodes();
                $user->enableTotp($secret, $codes);
                $this->entityManager->flush();
                $session->remove(self::PENDING_SECRET);
                $this->logger->info('double authentification activée', ['user' => $user->getId()]);

                return $this->render('account/backup_codes.html.twig', ['codes' => $codes, 'first' => true]);
            }
            $error = 'Code incorrect. Vérifiez l\'heure de votre téléphone et saisissez le code affiché maintenant.';
        }
        $uri = $this->totpFor($user, $secret)->getProvisioningUri();

        return $this->render('account/two_factor.html.twig', [
            'secret' => trim(chunk_split($secret, 4, ' ')),
            'qr' => new QRCode(new QROptions(['outputType' => QROutputInterface::MARKUP_SVG, 'outputBase64' => true, 'scale' => 6]))->render($uri),
            'error' => $error,
        ], new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK));
    }

    #[Route('/double-authentification/desactiver', name: 'app_account_2fa_disable', methods: ['POST'])]
    public function disableTwoFactor(Request $request): Response
    {
        $user = $this->user();
        $this->requireCsrf('account_2fa_disable', $request);
        if (!$this->hasher->isPasswordValid($user, (string) $request->request->get('current_password'))) {
            $this->addFlash('error', 'Mot de passe incorrect : la double authentification reste active.');

            return $this->redirectToRoute('app_account');
        }
        $user->disableTotp();
        $this->entityManager->flush();
        $this->logger->info('double authentification désactivée', ['user' => $user->getId()]);
        $this->addFlash('success', 'Double authentification désactivée.');

        return $this->redirectToRoute('app_account');
    }

    #[Route('/codes-de-secours', name: 'app_account_backup_codes', methods: ['POST'])]
    public function regenerateBackupCodes(Request $request): Response
    {
        $user = $this->user();
        $this->requireCsrf('account_backup_codes', $request);
        $config = $user->getTotpAuthenticationConfiguration();
        if (null === $config || !$this->hasher->isPasswordValid($user, (string) $request->request->get('current_password'))) {
            $this->addFlash('error', 'Mot de passe incorrect : les codes de secours n\'ont pas changé.');

            return $this->redirectToRoute('app_account');
        }
        $codes = $this->newBackupCodes();
        $user->enableTotp($config->getSecret(), $codes);
        $this->entityManager->flush();

        return $this->render('account/backup_codes.html.twig', ['codes' => $codes, 'first' => false]);
    }

    /** Portabilité (RGPD, article 20) : tout ce que l'espace client sait du compte, en JSON. Jamais de secret ni d'empreinte. */
    #[Route('/export', name: 'app_account_export', methods: ['POST'])]
    public function export(Request $request, LicenceRepository $licences): Response
    {
        $user = $this->user();
        $this->requireCsrf('account_export', $request);
        $ownLicences = array_map(static fn(\Grichard\Portal\Entity\Licence $l): array => [
            'cle' => $l->getKey(),
            'produit' => $l->getProduct(),
            'formule' => $l->getPlan(),
            'etat' => $l->getStatus(),
            'valide_jusqu_au' => $l->getValidUntil()?->format(\DATE_ATOM),
            'mises_a_jour_jusqu_au' => $l->getUpdatesUntil()?->format(\DATE_ATOM),
            'creee_le' => $l->getCreatedAt()->format(\DATE_ATOM),
        ], $licences->forUser($user));
        $response = new JsonResponse([
            'compte' => [
                'email' => $user->getEmail(),
                'cree_le' => $user->getCreatedAt()->format(\DATE_ATOM),
                'adresse_verifiee_le' => $user->getVerifiedAt()?->format(\DATE_ATOM),
                'derniere_connexion' => $user->getLastLoginAt()?->format(\DATE_ATOM),
                'roles' => $user->getRoles(),
                'double_authentification' => $user->isTotpAuthenticationEnabled(),
            ],
            'licences' => $ownLicences,
            'exporte_le' => new \DateTimeImmutable()->format(\DATE_ATOM),
        ]);
        $response->setEncodingOptions(\JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR);
        $response->headers->set('Content-Disposition', 'attachment; filename="espace-client-grichard-eu.json"');

        return $response;
    }

    #[Route('/supprimer', name: 'app_account_delete', methods: ['GET', 'POST'])]
    public function delete(Request $request, UserRepository $users, LicenceRepository $licences, TokenStorageInterface $tokenStorage): Response
    {
        $user = $this->user();
        $error = null;
        if ($request->isMethod('POST')) {
            $this->requireCsrf('account_delete', $request);
            if (!$this->hasher->isPasswordValid($user, (string) $request->request->get('current_password'))) {
                $error = 'Mot de passe incorrect.';
            } elseif (!$request->request->getBoolean('confirm')) {
                $error = 'Cochez la case pour confirmer la suppression.';
            } elseif (\in_array('ROLE_ADMIN', $user->getRoles(), true) && 1 === \count(array_filter($users->findAll(), static fn(User $u): bool => \in_array('ROLE_ADMIN', $u->getRoles(), true)))) {
                $error = 'Le dernier administrateur ne peut pas supprimer son compte.';
            } else {
                $id = $user->getId();
                $this->entityManager->getConnection()->executeStatement('DELETE FROM user_token WHERE user_id = ?', [$id]);
                $licences->detachAll($user);
                $this->entityManager->remove($user);
                $this->entityManager->flush();
                $tokenStorage->setToken(null);
                $request->getSession()->invalidate();
                $this->logger->info('compte supprimé', ['user' => $id]);
                $this->addFlash('success', 'Votre compte et ses données ont été supprimés.');

                return $this->redirectToRoute('app_login');
            }
        }

        return $this->render(
            'account/delete.html.twig',
            ['error' => $error],
            new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK)
        );
    }

    private function user(): User
    {
        $user = $this->getUser();
        \assert($user instanceof User);

        return $user;
    }

    private function requireCsrf(string $id, Request $request): void
    {
        if (!$this->isCsrfTokenValid($id, (string) $request->request->get('_token'))) {
            throw $this->createAccessDeniedException('Jeton de sécurité invalide.');
        }
    }

    private function totpFor(User $user, string $secret): TOTP
    {
        if ('' === $secret) {
            throw new \LogicException('Secret TOTP vide.');
        }
        $totp = TOTP::createFromSecret($secret);
        $totp->setLabel($user->getUserIdentifier());
        $totp->setIssuer('grichard.eu');

        return $totp;
    }

    /** @return list<string> codes de 10 caractères, groupés par 5 pour la lecture (le tiret est ignoré à la saisie) */
    private function newBackupCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < self::BACKUP_CODE_COUNT; ++$i) {
            $raw = bin2hex(random_bytes(5));
            $codes[] = substr($raw, 0, 5) . '-' . substr($raw, 5);
        }

        return $codes;
    }
}
