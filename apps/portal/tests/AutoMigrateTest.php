<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Grichard\Portal\Setup\AutoMigrateListener;
use Grichard\Portal\Setup\MigrationRunner;
use Psr\Log\NullLogger;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

/** Une livraison qui ajoute une migration ne doit pas bloquer la connexion : migrations appliquées à la première requête. */
final class AutoMigrateTest extends PortalTestCase
{
    public function testFirstRequestOfABuildAppliesPendingMigrationsOnce(): void
    {
        $this->freshDatabase();
        static::createClient();
        $database = (string) $_SERVER['PORTAL_DB'];
        touch($database); // base créée par l'installation, sans les dernières migrations
        $cacheDir = (string) $_SERVER['PORTAL_VAR_DIR'] . '/auto-migrate-' . bin2hex(random_bytes(4));
        mkdir($cacheDir, 0o777, true);
        $runner = $this->service(MigrationRunner::class);
        self::assertNotSame([], $runner->pending());

        $listener = new AutoMigrateListener($runner, $cacheDir, $database, true, new NullLogger());
        $listener->onRequest($this->event());
        self::assertSame([], $runner->pending());
        self::assertFileExists($cacheDir . '/migrations-ok');

        // Désactivé (développement, tests) ou sans base (avant /setup) : rien ne se passe
        unlink($cacheDir . '/migrations-ok');
        new AutoMigrateListener($runner, $cacheDir, $database, false, new NullLogger())->onRequest($this->event());
        new AutoMigrateListener($runner, $cacheDir, $cacheDir . '/absente.sqlite', true, new NullLogger())->onRequest($this->event());
        self::assertFileDoesNotExist($cacheDir . '/migrations-ok');
    }

    private function event(): RequestEvent
    {
        return new RequestEvent(static::$kernel ?? throw new \LogicException('noyau absent'), Request::create('/login'), HttpKernelInterface::MAIN_REQUEST);
    }
}
