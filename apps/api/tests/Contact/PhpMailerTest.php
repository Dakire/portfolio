<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Contact;

use Grichard\Api\Contact\ContactMessage;
use Grichard\Api\Contact\PhpMailer;
use PHPUnit\Framework\TestCase;

final class PhpMailerTest extends TestCase
{
    public function testHeadersAreFixedAndCannotBeInjected(): void
    {
        $message = ContactMessage::fromInput([
            'name' => "Jean\r\nBcc: victime@example.org",
            'email' => 'jean@example.org',
            'message' => "Bonjour\r\nBcc: victime@example.org",
        ]);
        self::assertNotNull($message);

        $headers = new PhpMailer('contact@grichard.eu', 'noreply@grichard.eu')->headers($message);

        self::assertSame(
            "From: noreply@grichard.eu\r\nReply-To: jean@example.org\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8",
            $headers,
        );
        self::assertSame(3, substr_count($headers, "\r\n"), 'quatre en-têtes exactement, aucune ligne ajoutée');
    }
}
