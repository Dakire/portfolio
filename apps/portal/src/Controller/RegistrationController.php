<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Account\AccountMailer;
use Grichard\Portal\Account\PasswordPolicy;
use Grichard\Portal\Account\TokenService;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Entity\UserToken;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Repository\UserRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Inscription d'un client et confirmation de son adresse. La réponse est toujours la même, que l'adresse soit nouvelle ou déjà
 * enregistrée : le titulaire d'un compte existant est prévenu par e-mail, rien n'est révélé à l'écran.
 */
final class RegistrationController extends AbstractController
{
    public function __construct(
        private readonly TokenService $tokens,
        private readonly AccountMailer $mailer,
        #[Autowire(service: 'monolog.logger.portal')]
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/inscription', name: 'app_register', methods: ['GET', 'POST'])]
    public function register(
        Request $request,
        UserRepository $users,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $hasher,
        RateLimiterFactory $registrationLimiter,
        RateLimiterFactory $accountMailLimiter,
    ): Response {
        if ($this->getUser() instanceof UserInterface) {
            return $this->redirectToRoute('app_home');
        }
        $error = null;
        $email = '';
        if ($request->isMethod('POST')) {
            $email = strtolower(trim((string) $request->request->get('email')));
            $password = (string) $request->request->get('password');
            if (!$registrationLimiter->create($request->getClientIp() ?? 'inconnu')->consume()->isAccepted()) {
                return $this->tooMany();
            }
            if (!$this->isCsrfTokenValid('register', (string) $request->request->get('_token'))) {
                $error = 'Jeton de sécurité invalide, rechargez la page.';
            } elseif (false === filter_var($email, \FILTER_VALIDATE_EMAIL) || \strlen($email) > 180) {
                $error = 'Adresse e-mail invalide.';
            } elseif (null !== ($problem = PasswordPolicy::check($password, (string) $request->request->get('password_confirm')))) {
                $error = $problem;
            } elseif (!$request->request->getBoolean('terms')) {
                $error = 'Merci d\'accepter les conditions d\'utilisation de l\'espace client.';
            } else {
                $users->deleteStaleUnverified();
                // Une adresse ne reçoit pas plus de quelques e-mails par heure, quel que soit l'expéditeur de la demande.
                if ($accountMailLimiter->create(hash('sha256', $email))->consume()->isAccepted()) {
                    $existing = $users->findByEmail($email);
                    if (null !== $existing) {
                        $this->mailer->alreadyRegistered(
                            $existing,
                            $this->generateUrl('app_login', [], UrlGeneratorInterface::ABSOLUTE_URL),
                            $this->generateUrl('app_forgot_password', [], UrlGeneratorInterface::ABSOLUTE_URL),
                        );
                    } else {
                        $user = new User($email, '');
                        $user->setPassword($hasher->hashPassword($user, $password));
                        $entityManager->persist($user);
                        $entityManager->flush();
                        $this->sendVerification($user);
                        $this->logger->info('inscription', ['user' => $user->getId()]);
                    }
                }

                return $this->render('account/check_inbox.html.twig', ['email' => $email]);
            }
        }

        return $this->render('account/register.html.twig', [
            'email' => $email,
            'error' => $error,
            'min_length' => PasswordPolicy::MIN_LENGTH,
        ], new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK));
    }

    #[Route('/verifier/{token}', name: 'app_verify_email', requirements: ['token' => '[A-Za-z0-9_-]{20,100}'], methods: ['GET', 'POST'])]
    public function verify(string $token, Request $request, EntityManagerInterface $entityManager, LicenceRepository $licences): Response
    {
        // GET : page de confirmation sans effet (les antivirus de messagerie ouvrent les liens) ; POST : la vérification.
        if (!$request->isMethod('POST')) {
            return $this->render('account/verify.html.twig', [
                'token' => $token,
                'valid' => null !== $this->tokens->peek($token, UserToken::VERIFY),
            ]);
        }
        if (!$this->isCsrfTokenValid('verify', (string) $request->request->get('_token'))) {
            throw $this->createAccessDeniedException();
        }
        $user = $this->tokens->consume($token, UserToken::VERIFY);
        if (null === $user) {
            return $this->render('account/verify.html.twig', ['token' => $token, 'valid' => false], new Response(status: Response::HTTP_GONE));
        }
        $user->markVerified();
        $entityManager->flush();
        $licences->attachPending($user); // achats faits avant l'inscription, avec la même adresse
        $this->logger->info('adresse vérifiée', ['user' => $user->getId()]);
        $this->addFlash('success', 'Adresse confirmée. Vous pouvez vous connecter.');

        return $this->redirectToRoute('app_login');
    }

    #[Route('/verifier', name: 'app_verify_resend', methods: ['GET', 'POST'])]
    public function resend(Request $request, UserRepository $users, RateLimiterFactory $accountMailLimiter, RateLimiterFactory $registrationLimiter): Response
    {
        if ($request->isMethod('POST')) {
            if (!$registrationLimiter->create($request->getClientIp() ?? 'inconnu')->consume()->isAccepted()) {
                return $this->tooMany();
            }
            if (!$this->isCsrfTokenValid('verify_resend', (string) $request->request->get('_token'))) {
                throw $this->createAccessDeniedException();
            }
            $email = strtolower(trim((string) $request->request->get('email')));
            $user = $users->findByEmail($email);
            if (null !== $user && !$user->isVerified() && $accountMailLimiter->create(hash('sha256', $email))->consume()->isAccepted()) {
                $this->sendVerification($user);
            }

            return $this->render('account/check_inbox.html.twig', ['email' => $email]);
        }

        return $this->render('account/resend.html.twig');
    }

    private function sendVerification(User $user): void
    {
        $raw = $this->tokens->issue($user, UserToken::VERIFY);
        $this->mailer->verification($user, $this->generateUrl('app_verify_email', ['token' => $raw], UrlGeneratorInterface::ABSOLUTE_URL));
    }

    private function tooMany(): Response
    {
        return $this->render('account/too_many.html.twig', [], new Response(status: Response::HTTP_TOO_MANY_REQUESTS));
    }
}
