<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Grichard\Portal\Repository\UserRepository;
use Grichard\Portal\Setup\MigrationRunner;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/** Réservé aux administrateurs (access_control de security.yaml). */
final class AdminController extends AbstractController
{
    #[Route('/admin', name: 'app_admin', methods: ['GET'])]
    public function index(UserRepository $users): Response
    {
        return $this->render('admin/index.html.twig', ['userCount' => $users->countAll()]);
    }

    #[Route('/admin/maintenance', name: 'app_admin_maintenance', methods: ['GET', 'POST'])]
    public function maintenance(
        Request $request,
        MigrationRunner $migrations,
        #[Autowire(service: 'monolog.logger.portal')]
        LoggerInterface $logger,
    ): Response {
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('maintenance', (string) $request->request->get('_token'))) {
                return new Response('Jeton de sécurité invalide.', Response::HTTP_FORBIDDEN);
            }
            $applied = $migrations->migrate();
            $logger->info('maintenance : migrations appliquées', ['count' => $applied]);
            $this->addFlash('success', 0 === $applied ? 'La base est déjà à jour.' : \sprintf('%d migration(s) appliquée(s).', $applied));

            return new RedirectResponse($this->generateUrl('app_admin_maintenance'));
        }

        return $this->render('admin/maintenance.html.twig', [
            'pending' => $migrations->pending(),
            'current' => $migrations->currentVersion(),
        ]);
    }
}
