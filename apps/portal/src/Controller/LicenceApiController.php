<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Grichard\Portal\Licence\LicenceSigner;
use Grichard\Portal\Repository\LicenceRepository;
use Grichard\Portal\Shop\Downloads;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * API publique appelée par les produits (docs/licences.md). Sans session ni cookie ; l'authentification est le jeton de
 * licence signé lui-même. Limitée par adresse IP. Réponses en JSON, sans donnée personnelle.
 */
#[AsController]
#[Route('/api')]
final class LicenceApiController
{
    public function __construct(
        private readonly LicenceSigner $signer,
        private readonly LicenceRepository $licences,
        private readonly RateLimiterFactory $licenceApiLimiter,
    ) {}

    #[Route('/licence/cle-publique', name: 'app_api_public_key', methods: ['GET'])]
    public function publicKey(): JsonResponse
    {
        if (!$this->signer->isConfigured()) {
            return $this->error('licences non configurées', Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return new JsonResponse(['alg' => 'Ed25519', 'kid' => $this->signer->keyId(), 'key' => $this->signer->publicKey()]);
    }

    /** Nouveau jeton (abonnement renouvelé, mises à jour prolongées), si la licence est toujours utilisable. */
    #[Route('/licence/renouveler', name: 'app_api_licence_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        if (null !== ($limited = $this->limit($request))) {
            return $limited;
        }
        $licence = $this->licenceFrom($this->tokenFrom($request));
        if (null === $licence) {
            return $this->error('jeton invalide', Response::HTTP_UNAUTHORIZED);
        }
        if (!$licence->isUsable()) {
            return new JsonResponse(['statut' => $licence->getStatus(), 'erreur' => 'licence expirée ou révoquée'], Response::HTTP_GONE);
        }

        return new JsonResponse(['statut' => $licence->getStatus(), 'jeton' => $this->signer->token($licence)]);
    }

    /** Dernière version couverte par la licence, avec un lien de téléchargement signé valable une heure. */
    #[Route('/mises-a-jour/{product}', name: 'app_api_updates', requirements: ['product' => '[a-z0-9-]+'], methods: ['GET', 'POST'])]
    public function updates(string $product, Request $request, Downloads $downloads, UrlGeneratorInterface $urls): JsonResponse
    {
        if (null !== ($limited = $this->limit($request))) {
            return $limited;
        }
        $licence = $this->licenceFrom($this->tokenFrom($request));
        if (null === $licence || $licence->getProduct() !== $product) {
            return $this->error('jeton invalide pour ce produit', Response::HTTP_UNAUTHORIZED);
        }
        $latest = $downloads->versions($product)[0] ?? null;
        if (null === $latest) {
            return $this->error('aucune version publiée', Response::HTTP_NOT_FOUND);
        }
        if (!$licence->coversUpdatesAt($latest['published'])) {
            return new JsonResponse([
                'version' => $latest['version'],
                'couverte' => false,
                'erreur' => $licence->isUsable() ? 'mises à jour expirées : prolongez-les depuis l\'espace client' : 'licence expirée ou révoquée',
            ], Response::HTTP_PAYMENT_REQUIRED);
        }
        $signed = $downloads->sign($product, $latest['version']);

        return new JsonResponse([
            'version' => $latest['version'],
            'couverte' => true,
            'publiee' => $latest['published']->format(\DATE_ATOM),
            'taille' => $latest['size'],
            'telechargement' => $urls->generate('app_api_download', ['product' => $product, 'version' => $latest['version']] + $signed, UrlGeneratorInterface::ABSOLUTE_URL),
        ]);
    }

    #[Route('/telechargement/{product}/{version}', name: 'app_api_download', requirements: ['product' => '[a-z0-9-]+', 'version' => '\d+\.\d+\.\d+(-[a-z0-9.]+)?'], methods: ['GET'])]
    public function download(string $product, string $version, Request $request, Downloads $downloads): Response
    {
        $expires = $request->query->getInt('expires');
        if (!$downloads->isSignatureValid($product, $version, $expires, $request->query->getString('sig'))) {
            return $this->error('lien expiré ou invalide', Response::HTTP_FORBIDDEN);
        }
        $file = $downloads->find($product, $version);
        if (null === $file) {
            return $this->error('version introuvable', Response::HTTP_NOT_FOUND);
        }

        return new BinaryFileResponse($file['file'], Response::HTTP_OK, [], false, ResponseHeaderBag::DISPOSITION_ATTACHMENT);
    }

    private function tokenFrom(Request $request): string
    {
        $header = (string) $request->headers->get('Authorization', '');
        if (str_starts_with($header, 'Licence ')) {
            return trim(substr($header, 8));
        }
        $json = json_decode($request->getContent(), true);

        return \is_array($json) && \is_string($json['jeton'] ?? null) ? $json['jeton'] : $request->request->getString('jeton');
    }

    private function licenceFrom(string $token): ?\Grichard\Portal\Entity\Licence
    {
        if ('' === $token || !$this->signer->isConfigured()) {
            return null;
        }
        $payload = $this->signer->verify($token);
        $key = \is_array($payload) && \is_string($payload['lic'] ?? null) ? $payload['lic'] : null;

        return null === $key ? null : $this->licences->findByKey($key);
    }

    private function limit(Request $request): ?JsonResponse
    {
        return $this->licenceApiLimiter->create($request->getClientIp() ?? 'inconnu')->consume()->isAccepted()
            ? null
            : $this->error('trop de requêtes', Response::HTTP_TOO_MANY_REQUESTS);
    }

    private function error(string $message, int $status): JsonResponse
    {
        return new JsonResponse(['erreur' => $message], $status);
    }
}
