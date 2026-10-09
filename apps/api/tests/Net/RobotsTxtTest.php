<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Net;

use Grichard\Api\Net\RobotsTxt;
use PHPUnit\Framework\TestCase;

final class RobotsTxtTest extends TestCase
{
    private const ROBOTS = <<<'TXT'
        # commentaire
        User-agent: *
        Disallow: /admin/
        Disallow: /*.pdf$
        Allow: /admin/public/
        Crawl-delay: 5

        User-agent: Googlebot
        User-agent: Bingbot
        Disallow: /prive
        Allow: /prive/ouvert

        Sitemap: https://exemple.fr/sitemap.xml
        Sitemap: https://exemple.fr/sitemap.xml
        TXT;

    public function testAppliesTheGenericGroup(): void
    {
        $robots = RobotsTxt::parse(self::ROBOTS);
        self::assertFalse($robots->allows('/admin/config', 'otherbot'));
        self::assertTrue($robots->allows('/admin/public/page', 'otherbot'), 'la règle la plus longue gagne');
        self::assertFalse($robots->allows('/doc/a.pdf', 'otherbot'));
        self::assertTrue($robots->allows('/doc/a.pdf?x=1', 'otherbot'), '« $ » ancre la fin');
        self::assertTrue($robots->allows('/blog/', 'otherbot'));
    }

    public function testASpecificGroupReplacesTheGenericOne(): void
    {
        $robots = RobotsTxt::parse(self::ROBOTS);
        self::assertTrue($robots->allows('/admin/config', 'Googlebot'), 'Googlebot ne suit que son groupe');
        self::assertFalse($robots->allows('/prive/doc', 'googlebot'));
        self::assertTrue($robots->allows('/prive/ouvert/x', 'googlebot'));
        self::assertFalse($robots->allows('/privee', 'bingbot'));
    }

    public function testCollectsSitemapsAndUnknownDirectives(): void
    {
        $robots = RobotsTxt::parse(self::ROBOTS);
        self::assertSame(['https://exemple.fr/sitemap.xml'], $robots->sitemaps);
        self::assertSame(['crawl-delay'], $robots->unknown);
    }

    public function testDetectsASiteClosedToRobots(): void
    {
        self::assertTrue(RobotsTxt::parse("User-agent: *\nDisallow: /")->blocksEverything());
        self::assertFalse(RobotsTxt::parse("User-agent: *\nDisallow:")->blocksEverything(), 'Disallow vide = tout autorisé');
        self::assertFalse(RobotsTxt::parse('')->blocksEverything());
    }
}
