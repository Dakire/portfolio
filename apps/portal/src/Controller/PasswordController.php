<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Account\AccountMailer;
use Grichard\Portal\Account\PasswordPolicy;
use Grichard\Portal\Account\TokenService;
use Grichard\Portal\Entity\UserToken;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Repository\UserRepository;
use Grichard\Portal\Repository\UserTokenRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/** Mot de passe oublié : lien valable une heure, à usage unique ; même réponse que l'adresse soit connue ou non. */
final class PasswordController extends AbstractController
{
    #[Route('/mot-de-passe-oublie', name: 'app_forgot_password', methods: ['GET', 'POST'])]
    public function forgot(
        Request $request,
        UserRepository $users,
        TokenService $tokens,
        AccountMailer $mailer,
        RateLimiterFactory $registrationLimiter,
        RateLimiterFactory $accountMailLimiter,
    ): Response {
        if ($request->isMethod('POST')) {
            if (!$registrationLimiter->create($request->getClientIp() ?? 'inconnu')->consume()->isAccepted()) {
                return $this->render('account/too_many.html.twig', [], new Response(status: Response::HTTP_TOO_MANY_REQUESTS));
            }
            if (!$this->isCsrfTokenValid('forgot', (string) $request->request->get('_token'))) {
                throw $this->createAccessDeniedException();
            }
            $email = strtolower(trim((string) $request->request->get('email')));
            $user = $users->findByEmail($email);
            if (null !== $user && $accountMailLimiter->create(hash('sha256', $email))->consume()->isAccepted()) {
                $raw = $tokens->issue($user, UserToken::RESET);
                $mailer->passwordReset($user, $this->generateUrl('app_reset_password', ['token' => $raw], UrlGeneratorInterface::ABSOLUTE_URL));
            }

            return $this->render('account/check_inbox.html.twig', ['email' => $email, 'reset' => true]);
        }

        return $this->render('account/forgot.html.twig');
    }

    #[Route('/reinitialiser/{token}', name: 'app_reset_password', requirements: ['token' => '[A-Za-z0-9_-]{20,100}'], methods: ['GET', 'POST'])]
    public function reset(
        string $token,
        Request $request,
        TokenService $tokens,
        UserTokenRepository $userTokens,
        EntityManagerInterface $entityManager,
        UserPasswordHasherInterface $hasher,
        AccountMailer $mailer,
        LicenceRepository $licences,
        #[Autowire(service: 'monolog.logger.portal')]
        LoggerInterface $logger,
    ): Response {
        $user = $tokens->peek($token, UserToken::RESET);
        if (null === $user) {
            return $this->render('account/reset.html.twig', ['valid' => false, 'error' => null, 'min_length' => PasswordPolicy::MIN_LENGTH], new Response(status: Response::HTTP_GONE));
        }
        $error = null;
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('reset', (string) $request->request->get('_token'))) {
                throw $this->createAccessDeniedException();
            }
            $password = (string) $request->request->get('password');
            $error = PasswordPolicy::check($password, (string) $request->request->get('password_confirm'));
            if (null === $error && null !== ($user = $tokens->consume($token, UserToken::RESET))) {
                $user->setPassword($hasher->hashPassword($user, $password));
                $user->markVerified(); // le lien prouve l'accès à la boîte
                $userTokens->deleteFor($user, UserToken::RESET);
                $entityManager->flush();
                $licences->attachPending($user);
                $mailer->passwordChanged($user);
                $logger->info('mot de passe réinitialisé', ['user' => $user->getId()]);
                $this->addFlash('success', 'Mot de passe modifié. Vous pouvez vous connecter.');

                return $this->redirectToRoute('app_login');
            }
        }

        return $this->render('account/reset.html.twig', [
            'valid' => true,
            'error' => $error,
            'min_length' => PasswordPolicy::MIN_LENGTH,
        ], new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK));
    }
}
