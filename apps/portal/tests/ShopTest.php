<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Grichard\Portal\Catalog\Catalog;

final class ShopTest extends PortalTestCase
{
    public function testAnonymousIsSentToLogin(): void
    {
        $client = $this->migratedClient();
        $client->request('GET', '/boutique');
        self::assertResponseRedirects('http://localhost/login');
    }

    public function testSignedInUserSeesEveryProductWithoutAnythingToBuy(): void
    {
        $client = $this->migratedClient();
        $client->loginUser($this->createUser('client@example.org'));
        $crawler = $client->request('GET', '/boutique');

        self::assertResponseIsSuccessful();
        self::assertSame('noindex, nofollow', $crawler->filter('meta[name=robots]')->attr('content'));
        self::assertCount(0, $crawler->filter('script, [style]'), 'ni script ni style en ligne (CSP)');
        self::assertSelectorTextContains('.notice', 'Rien n\'est en vente');
        self::assertCount(1, $crawler->filter('h1'));
        self::assertCount(\count(new Catalog()->all()), $crawler->filter('.product h2'));
        // Aperçu : aucun formulaire ni bouton d'achat avant l'ouverture
        self::assertCount(0, $crawler->filter('main form, main button'));
        self::assertCount(1, $crawler->filter('nav a[href="/boutique"]'), 'lien Boutique dans la navigation');
    }

    public function testProductSlugsAreUniqueAnchors(): void
    {
        $slugs = array_map(static fn($p) => $p->slug, new Catalog()->all());
        self::assertSame(array_values(array_unique($slugs)), $slugs);
        foreach ($slugs as $slug) {
            self::assertMatchesRegularExpression('/^[a-z0-9-]+$/', $slug);
        }
    }
}
