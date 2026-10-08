<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\UserRepository;
use Grichard\Portal\Setup\MigrationRunner;
use Grichard\Portal\Setup\SetupToken;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Installation par le navigateur (l'hébergement n'a pas de ligne de commande) : applique les migrations puis crée le premier
 * administrateur. Ouverte UNIQUEMENT tant qu'aucun utilisateur n'existe ET qu'un jeton d'installation est configuré dans
 * private/portal.php ; ensuite la page répond 404, comme si elle n'existait pas.
 */
final class SetupController extends AbstractController
{
    public const MIN_PASSWORD_LENGTH = 14;

    #[Route('/setup', name: 'app_setup', methods: ['GET', 'POST'])]
    public function setup(
        Request $request,
        SetupToken $token,
        UserRepository $users,
        MigrationRunner $migrations,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $hasher,
        RateLimiterFactory $setupLimiter,
        #[Autowire(service: 'monolog.logger.portal')]
        LoggerInterface $logger,
    ): Response {
        if (!$token->isConfigured() || $users->countAll() > 0) {
            throw $this->createNotFoundException();
        }

        $error = null;
        $email = '';
        if ($request->isMethod('POST')) {
            $email = trim((string) $request->request->get('email'));
            $password = (string) $request->request->get('password');

            if (!$setupLimiter->create($request->getClientIp() ?? 'inconnu')->consume()->isAccepted()) {
                return new Response('Trop d\'essais. Réessayez plus tard.', Response::HTTP_TOO_MANY_REQUESTS);
            }
            if (!$this->isCsrfTokenValid('setup', (string) $request->request->get('_token'))) {
                $error = 'Jeton de sécurité invalide, rechargez la page.';
            } elseif (!$token->matches((string) $request->request->get('setup_token'))) {
                $logger->warning('installation : jeton refusé');
                $error = 'Jeton d\'installation incorrect.';
            } elseif (false === filter_var($email, \FILTER_VALIDATE_EMAIL) || \strlen($email) > 180) {
                $error = 'Adresse e-mail invalide.';
            } elseif (mb_strlen($password) < self::MIN_PASSWORD_LENGTH) {
                $error = \sprintf('Le mot de passe doit faire au moins %d caractères.', self::MIN_PASSWORD_LENGTH);
            } elseif ($password !== (string) $request->request->get('password_confirm')) {
                $error = 'Les deux mots de passe ne correspondent pas.';
            } else {
                $migrations->migrate();
                if ($users->countAll() > 0) {
                    throw $this->createNotFoundException(); // course : un autre navigateur a terminé l'installation
                }
                $admin = new User(strtolower($email), '');
                $admin->setPassword($hasher->hashPassword($admin, $password));
                $admin->setRoles(['ROLE_ADMIN']);
                $entityManager->persist($admin);
                $entityManager->flush();
                $logger->info('installation : administrateur créé', ['id' => $admin->getId()]);
                $this->addFlash('success', 'Installation terminée. Vous pouvez vous connecter.');

                return new RedirectResponse($this->generateUrl('app_login'));
            }
        }

        return $this->render('setup/index.html.twig', [
            'error' => $error,
            'email' => $email,
            'min_length' => self::MIN_PASSWORD_LENGTH,
        ], new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK));
    }
}
