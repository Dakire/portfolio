<?php

declare(strict_types=1);

namespace Grichard\Portal\Tests;

use Grichard\Portal\Catalog\Catalog;
use Grichard\Portal\Catalog\Product;
use Grichard\Portal\Catalog\Stage;

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
        self::assertCount(0, $crawler->filter('script:not([src]), style, [style]'), 'ni script ni style en ligne (CSP)');
        self::assertSelectorTextContains('.alert', 'Rien n\'est en vente');
        self::assertCount(1, $crawler->filter('h1'));
        self::assertCount(\count(new Catalog()->all()), $crawler->filter('.product-row h3'));
        // Une rubrique par étape représentée, dans l'ordre des étapes
        self::assertSame(
            array_map(static fn(array $g): string => $g['stage']->title(), new Catalog()->byStage()),
            $crawler->filter('.shop-section .rubric h2')->each(static fn($h) => $h->text()),
        );
        // Aperçu : aucun formulaire ni bouton d'achat avant l'ouverture
        self::assertCount(0, $crawler->filter('main form, main button'));
        self::assertSame('page', $crawler->filter('nav a[href="/boutique"]')->attr('aria-current'), 'page courante signalée');
    }

    public function testCatalogIsConsistent(): void
    {
        $products = new Catalog()->all();
        $slugs = array_map(static fn(Product $p): string => $p->slug, $products);
        self::assertSame(array_values(array_unique($slugs)), $slugs);
        foreach ($slugs as $slug) {
            self::assertMatchesRegularExpression('/^[a-z0-9-]+$/', $slug);
        }
        // Chaque produit est dans exactement un groupe, et chaque groupe est non vide
        $grouped = array_merge(...array_map(static fn(array $g): array => $g['products'], new Catalog()->byStage()));
        self::assertCount(\count($products), $grouped);
        self::assertContains(Stage::Launch, array_map(static fn(Product $p): Stage => $p->stage, $products));
    }
}
