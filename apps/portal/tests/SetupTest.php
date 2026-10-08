<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Grichard\Portal\Repository\UserRepository;

final class SetupTest extends PortalTestCase
{
    private const TOKEN = 'jeton-installation-de-test-0123456789';

    /**
     * @param array<string, string> $override
     *
     * @return array<string, string>
     */
    private function fill(array $override = []): array
    {
        return $override + [
            'setup_token' => self::TOKEN,
            'email' => 'Admin@Example.org',
            'password' => 'un-mot-de-passe-solide-1',
            'password_confirm' => 'un-mot-de-passe-solide-1',
        ];
    }

    public function testFreshInstallationCreatesDatabaseAndAdministrator(): void
    {
        $this->freshDatabase();
        $client = static::createClient(); // aucune migration : la base n'existe pas encore
        $client->request('GET', '/setup');
        self::assertResponseIsSuccessful();
        $client->submitForm('Installer', $this->fill());
        self::assertResponseRedirects('/login');

        $users = $this->service(UserRepository::class);
        self::assertSame(1, $users->countAll());
        $admin = $users->findOneBy([]);
        self::assertSame('admin@example.org', $admin?->getEmail());
        self::assertContains('ROLE_ADMIN', $admin->getRoles());

        $client->request('GET', '/setup');
        self::assertResponseStatusCodeSame(404, 'l\'installation se ferme d\'elle-même');
    }

    public function testWrongTokenAndWeakPasswordAreRefused(): void
    {
        $this->freshDatabase();
        $client = static::createClient();
        $client->request('GET', '/setup');
        $client->submitForm('Installer', $this->fill(['setup_token' => 'mauvais jeton mauvais jeton']));
        self::assertResponseStatusCodeSame(422);
        self::assertSelectorTextContains('[role=alert]', 'Jeton');

        $client->request('GET', '/setup');
        $client->submitForm('Installer', $this->fill(['password' => 'court', 'password_confirm' => 'court']));
        self::assertResponseStatusCodeSame(422);
        self::assertSelectorTextContains('[role=alert]', '14 caractères');
        self::assertSame(0, $this->service(UserRepository::class)->countAll());
    }

    public function testSetupIsClosedOnceAnyUserExists(): void
    {
        $client = $this->migratedClient();
        $this->createUser('deja@example.org');
        $client->request('GET', '/setup');
        self::assertResponseStatusCodeSame(404);
    }

    public function testSetupIsThrottled(): void
    {
        $this->freshDatabase();
        $client = static::createClient();
        for ($i = 0; $i < 6; ++$i) {
            $client->request('GET', '/setup');
            $client->submitForm('Installer', $this->fill(['setup_token' => 'mauvais jeton mauvais jeton ' . $i]));
        }
        self::assertResponseStatusCodeSame(429);
    }
}
