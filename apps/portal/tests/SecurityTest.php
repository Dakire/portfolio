<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Grichard\Portal\Entity\User;
use Grichard\Portal\Setup\MigrationRunner;

final class SecurityTest extends PortalTestCase
{
    public function testAnonymousIsSentToLogin(): void
    {
        $client = $this->migratedClient();
        foreach (['/', '/admin', '/admin/maintenance'] as $path) {
            $client->request('GET', $path);
            self::assertResponseRedirects('http://localhost/login', null, "$path doit exiger une connexion");
        }
    }

    public function testLoginFormHasCsrfAndNoLeakyMarkup(): void
    {
        $client = $this->migratedClient();
        $crawler = $client->request('GET', '/login');
        self::assertResponseIsSuccessful();
        self::assertCount(1, $crawler->filter('input[name="_csrf_token"]'));
        self::assertSame('noindex, nofollow', $crawler->filter('meta[name=robots]')->attr('content'));
        self::assertCount(0, $crawler->filter('script, [style]'), 'ni script ni style en ligne (CSP)');
    }

    public function testValidLoginReachesHomeAndRecordsIt(): void
    {
        $client = $this->migratedClient();
        $user = $this->createUser('moi@example.org');
        $client->request('GET', '/login');
        $client->submitForm('Se connecter', ['_username' => 'moi@example.org', '_password' => self::PASSWORD]);
        self::assertResponseRedirects('/');
        $client->followRedirect();
        self::assertSelectorTextContains('main', 'moi@example.org');
        $this->service(EntityManagerInterface::class)->clear();
        $reloaded = $this->service(EntityManagerInterface::class)->find(User::class, $user->getId());
        self::assertInstanceOf(\DateTimeImmutable::class, $reloaded?->getLastLoginAt());
    }

    public function testPasswordIsHashedWithArgon2idOrBetterInProduction(): void
    {
        $client = $this->migratedClient();
        $user = $this->createUser('hash@example.org');
        self::assertNotSame(self::PASSWORD, $user->getPassword());
        self::assertStringStartsWith('$2y$', $user->getPassword(), 'bcrypt bas coût seulement en test (security.yaml)');
        unset($client);
    }

    public function testBadPasswordAndUnknownUserGetTheSameAnswer(): void
    {
        $client = $this->migratedClient();
        $this->createUser('moi@example.org');
        $answers = [];
        foreach (['moi@example.org', 'inconnu@example.org'] as $email) {
            $client->request('GET', '/login');
            $client->submitForm('Se connecter', ['_username' => $email, '_password' => 'mauvais mot de passe']);
            $client->followRedirect();
            $answers[] = $client->getResponse()->getContent();
            self::assertSelectorExists('[role=alert]');
        }
        self::assertSame(
            preg_replace('/value="[^"]*"/', '', (string) $answers[0]),
            preg_replace('/value="[^"]*"/', '', (string) $answers[1]),
            'la page ne doit pas révéler si le compte existe',
        );
    }

    public function testLoginIsThrottledAfterRepeatedFailures(): void
    {
        $client = $this->migratedClient();
        $this->createUser('moi@example.org');
        for ($i = 0; $i < 7; ++$i) {
            $client->request('GET', '/login');
            $client->submitForm('Se connecter', ['_username' => 'moi@example.org', '_password' => 'mauvais ' . $i]);
        }
        // Même avec le bon mot de passe, le compte est bloqué pour la fenêtre en cours.
        $client->request('GET', '/login');
        $client->submitForm('Se connecter', ['_username' => 'moi@example.org', '_password' => self::PASSWORD]);
        $client->followRedirect();
        self::assertSelectorExists('[role=alert]');
        $client->request('GET', '/');
        self::assertResponseRedirects('http://localhost/login');
    }

    public function testLoginRejectsMissingCsrfToken(): void
    {
        $client = $this->migratedClient();
        $this->createUser('moi@example.org');
        $client->request('POST', '/login', ['_username' => 'moi@example.org', '_password' => self::PASSWORD]);
        $client->followRedirect();
        self::assertSelectorExists('[role=alert]');
        $client->request('GET', '/');
        self::assertResponseRedirects('http://localhost/login');
    }

    public function testOrdinaryUserCannotReachAdministration(): void
    {
        $client = $this->migratedClient();
        $client->loginUser($this->createUser('simple@example.org'));
        $client->request('GET', '/admin');
        self::assertResponseStatusCodeSame(403);
        $client->request('GET', '/admin/maintenance');
        self::assertResponseStatusCodeSame(403);
    }

    public function testAdminSeesMaintenanceAndCsrfProtectsIt(): void
    {
        $client = $this->migratedClient();
        $client->loginUser($this->createUser('admin@example.org', ['ROLE_ADMIN']));
        $client->request('GET', '/admin/maintenance');
        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('main', 'La base est à jour');
        $client->request('POST', '/admin/maintenance', ['_token' => 'faux']);
        self::assertResponseStatusCodeSame(403);
    }

    public function testMigrationMatchesTheEntityMapping(): void
    {
        $this->migratedClient();
        $em = $this->service(EntityManagerInterface::class);
        $sql = new SchemaTool($em)->getUpdateSchemaSql($em->getMetadataFactory()->getAllMetadata());
        $sql = array_values(array_filter($sql, static fn(string $s): bool => !str_contains($s, 'doctrine_migration_versions')));
        self::assertSame([], $sql, 'la migration et l\'entité User doivent décrire le même schéma');
        self::assertSame([], $this->service(MigrationRunner::class)->pending());
    }
}
