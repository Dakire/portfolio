<?php

declare(strict_types=1);

namespace Grichard\Portal;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

/**
 * Noyau de l'espace client de test.
 *
 * Sur l'hébergement, le code vit hors de la racine web (app/portal/) et tout ce qui s'écrit (cache, journaux, sessions, base SQLite)
 * va dans private/ (PORTAL_VAR_DIR), qui survit aux déploiements.
 */
final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function getCacheDir(): string
    {
        // Le cache de production n'est pas revalidé : un identifiant de livraison évite de servir l'ancien code après un déploiement.
        return $this->varDir() . '/cache/' . $this->environment . '-' . $this->buildId();
    }

    public function getLogDir(): string
    {
        return $this->varDir() . '/log';
    }

    private function varDir(): string
    {
        $dir = $_SERVER['PORTAL_VAR_DIR'] ?? $_ENV['PORTAL_VAR_DIR'] ?? null;

        return \is_string($dir) && '' !== $dir ? rtrim($dir, '/\\') : $this->getProjectDir() . '/var';
    }

    private function buildId(): string
    {
        $file = $this->getProjectDir() . '/BUILD_ID';
        $id = is_file($file) ? trim((string) file_get_contents($file)) : '';

        return 1 === preg_match('/^[A-Za-z0-9._-]{1,64}$/', $id) ? $id : 'dev';
    }
}
