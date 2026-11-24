<?php

declare(strict_types=1);

namespace Grichard\Portal\Shop;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Fichiers des produits, hors de la racine web : private/portal/downloads/<produit>/<produit>-<version>.zip, déposés par FTP.
 * La date de publication d'une version est la date du fichier (elle décide si une licence couvre la mise à jour). Les liens
 * de téléchargement publics (mises à jour des modules) sont signés et expirent : aucun fichier n'est jamais servi en direct.
 */
final readonly class Downloads
{
    public const LINK_TTL = 3600;

    public function __construct(
        #[Autowire('%portal.downloads_dir%')]
        private string $directory,
        #[Autowire('%kernel.secret%')]
        private string $secret,
    ) {}

    /** @return list<array{version: string, file: string, published: \DateTimeImmutable, size: int}> de la plus récente à la plus ancienne */
    public function versions(string $product): array
    {
        if (1 !== preg_match('/^[a-z0-9-]+$/', $product)) {
            return [];
        }
        $dir = $this->directory . '/' . $product;
        $versions = [];
        foreach (is_dir($dir) ? (scandir($dir) ?: []) : [] as $name) {
            if (1 === preg_match('/^' . preg_quote($product, '/') . '-(\d+\.\d+\.\d+(?:-[a-z0-9.]+)?)\.zip$/', $name, $m)) {
                $path = $dir . '/' . $name;
                $versions[] = [
                    'version' => $m[1],
                    'file' => $path,
                    'published' => new \DateTimeImmutable('@' . (filemtime($path) ?: 0)),
                    'size' => filesize($path) ?: 0,
                ];
            }
        }
        usort($versions, static fn(array $a, array $b): int => version_compare($b['version'], $a['version']));

        return $versions;
    }

    /** @return array{version: string, file: string, published: \DateTimeImmutable, size: int}|null */
    public function find(string $product, string $version): ?array
    {
        foreach ($this->versions($product) as $candidate) {
            if ($candidate['version'] === $version) {
                return $candidate;
            }
        }

        return null;
    }

    /** @return array{expires: int, sig: string} */
    public function sign(string $product, string $version, int $now = 0): array
    {
        $expires = (0 === $now ? time() : $now) + self::LINK_TTL;

        return ['expires' => $expires, 'sig' => $this->signature($product, $version, $expires)];
    }

    public function isSignatureValid(string $product, string $version, int $expires, string $signature, int $now = 0): bool
    {
        return $expires >= (0 === $now ? time() : $now) && hash_equals($this->signature($product, $version, $expires), $signature);
    }

    private function signature(string $product, string $version, int $expires): string
    {
        return hash_hmac('sha256', 'telechargement|' . $product . '|' . $version . '|' . $expires, $this->secret);
    }
}
