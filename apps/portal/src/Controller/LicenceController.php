<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Grichard\Portal\Entity\Licence;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Licence\LicenceSigner;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Shop\Downloads;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

/** Licences et téléchargements du client connecté : ses licences, leur jeton signé, les fichiers des produits couverts. */
final class LicenceController extends AbstractController
{
    #[Route('/licences', name: 'app_licences', methods: ['GET'])]
    public function index(LicenceRepository $licences, Downloads $downloads): Response
    {
        $user = $this->user();
        $rows = [];
        foreach ($licences->forUser($user) as $licence) {
            $versions = array_values(array_filter(
                $downloads->versions($licence->getProduct()),
                static fn(array $v): bool => $licence->coversUpdatesAt($v['published']),
            ));
            $rows[] = ['licence' => $licence, 'latest' => $versions[0] ?? null];
        }

        return $this->render('licence/index.html.twig', ['rows' => $rows]);
    }

    /** Jeton de licence à coller dans le produit (ou fichier .lic à importer). */
    #[Route('/licences/{key}/jeton', name: 'app_licence_token', requirements: ['key' => 'GR(-[A-Z0-9]{4}){4}'], methods: ['GET'])]
    public function token(string $key, LicenceRepository $licences, LicenceSigner $signer): Response
    {
        $licence = $this->owned($licences->findByKey($key));
        if (!$licence->isUsable()) {
            throw $this->createAccessDeniedException('Licence expirée ou révoquée.');
        }
        $response = new Response($signer->token($licence) . "\n", Response::HTTP_OK, ['Content-Type' => 'text/plain; charset=UTF-8']);
        $response->headers->set('Content-Disposition', $response->headers->makeDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $licence->getKey() . '.lic'));

        return $response;
    }

    #[Route('/licences/{key}/telecharger/{version}', name: 'app_licence_download', requirements: ['key' => 'GR(-[A-Z0-9]{4}){4}', 'version' => '\d+\.\d+\.\d+(-[a-z0-9.]+)?'], methods: ['GET'])]
    public function download(string $key, string $version, LicenceRepository $licences, Downloads $downloads): Response
    {
        $licence = $this->owned($licences->findByKey($key));
        $file = $downloads->find($licence->getProduct(), $version);
        if (null === $file) {
            throw $this->createNotFoundException();
        }
        if (!$licence->coversUpdatesAt($file['published'])) {
            throw $this->createAccessDeniedException('Cette version n\'est pas couverte par la licence.');
        }

        return new BinaryFileResponse($file['file'], Response::HTTP_OK, [], false, ResponseHeaderBag::DISPOSITION_ATTACHMENT);
    }

    private function owned(?Licence $licence): Licence
    {
        if (null === $licence || $licence->getUser()?->getId() !== $this->user()->getId()) {
            throw $this->createNotFoundException(); // la licence d'un autre client n'existe pas pour vous
        }

        return $licence;
    }

    private function user(): User
    {
        $user = $this->getUser();
        \assert($user instanceof User);

        return $user;
    }
}
