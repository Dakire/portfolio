<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Repository\UserRepository;
use Grichard\Portal\Shop\LicenceIssuer;
use Grichard\Portal\Shop\Offer;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/** Administration des licences : liste, attribution manuelle (essais, cadeaux, support) et révocation. */
#[Route('/admin/licences')]
final class AdminLicenceController extends AbstractController
{
    #[Route('', name: 'app_admin_licences', methods: ['GET', 'POST'])]
    public function index(
        Request $request,
        LicenceRepository $licences,
        UserRepository $users,
        LicenceIssuer $issuer,
        #[Autowire(service: 'monolog.logger.portal')]
        LoggerInterface $logger,
    ): Response {
        $error = null;
        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('admin_licence_grant', $request->request->getString('_token'))) {
                throw $this->createAccessDeniedException();
            }
            $email = strtolower(trim($request->request->getString('email')));
            [$product, $plan] = array_pad(explode('/', $request->request->getString('offer'), 2), 2, '');
            if (false === filter_var($email, \FILTER_VALIDATE_EMAIL)) {
                $error = 'Adresse e-mail invalide.';
            } elseif (null === Offer::find($product, $plan)) {
                $error = 'Formule inconnue.';
            } else {
                $user = $users->findByEmail($email);
                $licence = $issuer->issue($email, $user instanceof User && $user->isVerified() ? $user : null, $product, $plan);
                if (null === $licence) {
                    $error = 'Aucune licence perpétuelle à prolonger pour cette adresse.';
                } else {
                    $logger->info('licence attribuée par l\'administrateur', ['licence' => $licence->getId()]);
                    $this->addFlash('success', \sprintf('Licence %s attribuée.', $licence->getKey()));

                    return $this->redirectToRoute('app_admin_licences');
                }
            }
        }
        $offers = [];
        foreach (Offer::products() as $product) {
            foreach (Offer::plans($product) as $plan) {
                $offers[] = $product . '/' . $plan;
            }
        }

        return $this->render(
            'admin/licences.html.twig',
            ['licences' => $licences->latest(), 'offers' => $offers, 'error' => $error],
            new Response(status: null !== $error ? Response::HTTP_UNPROCESSABLE_ENTITY : Response::HTTP_OK)
        );
    }

    #[Route('/{id}/revoquer', name: 'app_admin_licence_revoke', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function revoke(int $id, Request $request, LicenceRepository $licences, EntityManagerInterface $entityManager): Response
    {
        if (!$this->isCsrfTokenValid('admin_licence_revoke_' . $id, $request->request->getString('_token'))) {
            throw $this->createAccessDeniedException();
        }
        $licence = $licences->find($id) ?? throw $this->createNotFoundException();
        $licence->revoke();
        $entityManager->flush();
        $this->addFlash('success', \sprintf('Licence %s révoquée.', $licence->getKey()));

        return $this->redirectToRoute('app_admin_licences');
    }
}
