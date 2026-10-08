<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Setup\MigrationRunner;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class PortalTestCase extends WebTestCase
{
    public const PASSWORD = 'un mot de passe assez long';

    /** Base neuve à chaque test (fichier SQLite jetable). */
    protected function freshDatabase(): void
    {
        $db = (string) $_SERVER['PORTAL_DB'];
        if (is_file($db)) {
            unlink($db);
        }
        if (!is_dir(\dirname($db))) {
            mkdir(\dirname($db), 0o777, true);
        }
        // Les compteurs de limitation vivent dans var/test/pools : on les repart de zéro aussi.
        $pools = (string) $_SERVER['PORTAL_VAR_DIR'] . '/pools';
        if (is_dir($pools)) {
            $this->removeTree($pools);
        }
    }

    protected function migratedClient(): KernelBrowser
    {
        $this->freshDatabase();
        $client = static::createClient();
        $this->service(MigrationRunner::class)->migrate();

        return $client;
    }

    /**
     * @template T of object
     * @param class-string<T> $id
     * @return T
     */
    protected function service(string $id): object
    {
        $service = self::getContainer()->get($id);
        self::assertInstanceOf($id, $service);

        return $service;
    }

    /** @param list<string> $roles */
    protected function createUser(string $email, array $roles = []): User
    {
        $container = self::getContainer();
        $user = new User($email, '');
        $user->setPassword($this->service(UserPasswordHasherInterface::class)->hashPassword($user, self::PASSWORD));
        $user->setRoles($roles);
        $em = $this->service(EntityManagerInterface::class);
        $em->persist($user);
        $em->flush();

        return $user;
    }

    private function removeTree(string $dir): void
    {
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST) as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }
    }
}
