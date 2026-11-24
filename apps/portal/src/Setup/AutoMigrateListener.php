<?php

declare(strict_types=1);

namespace Grichard\Portal\Setup;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Production : applique les migrations en attente à la première requête d'une nouvelle livraison. Sans cela, une migration
 * qui modifie la table des utilisateurs empêcherait de se connecter… donc d'atteindre /admin/maintenance pour l'appliquer.
 *
 * Une fois par livraison (marqueur dans le cache, propre à chaque BUILD_ID), sous verrou de fichier (deux requêtes
 * simultanées), et jamais avant l'installation (sans base, /setup s'en charge). /admin/maintenance reste le recours manuel.
 */
final readonly class AutoMigrateListener
{
    public function __construct(
        private MigrationRunner $migrations,
        #[Autowire('%kernel.cache_dir%')]
        private string $cacheDir,
        #[Autowire('%env(PORTAL_DB)%')]
        private string $database,
        #[Autowire('%portal.auto_migrate%')]
        private bool $enabled,
        #[Autowire(service: 'monolog.logger.portal')]
        private LoggerInterface $logger,
    ) {}

    #[AsEventListener(event: KernelEvents::REQUEST, priority: 64)]
    public function onRequest(RequestEvent $event): void
    {
        $marker = $this->cacheDir . '/migrations-ok';
        if (!$this->enabled || !$event->isMainRequest() || is_file($marker) || !is_file($this->database)) {
            return;
        }
        $lock = fopen($this->cacheDir . '/migrations.lock', 'c');
        if (false === $lock) {
            return;
        }
        try {
            flock($lock, \LOCK_EX);
            if (!is_file($marker)) {
                $applied = $this->migrations->migrate();
                file_put_contents($marker, (string) time());
                if ($applied > 0) {
                    $this->logger->info('migrations appliquées automatiquement', ['nombre' => $applied]);
                }
            }
        } catch (\Throwable $error) {
            // Pas de marqueur : nouvel essai à la requête suivante ; /admin/maintenance reste disponible
            $this->logger->error('migrations automatiques en échec', ['erreur' => $error->getMessage()]);
        } finally {
            flock($lock, \LOCK_UN);
            fclose($lock);
        }
    }
}
