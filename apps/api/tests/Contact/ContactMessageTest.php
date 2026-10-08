<?php

declare(strict_types=1);

namespace Grichard\Api\Tests\Contact;

use Grichard\Api\Contact\ContactMessage;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ContactMessageTest extends TestCase
{
    public function testValidInputIsAccepted(): void
    {
        $message = ContactMessage::fromInput(['name' => '  Jean Dupont ', 'email' => 'jean@example.org', 'message' => " Bonjour\n"]);

        self::assertNotNull($message);
        self::assertSame('Jean Dupont', $message->name);
        self::assertSame('jean@example.org', $message->email);
        self::assertSame('Bonjour', $message->message);
    }

    public function testControlCharactersInNameCannotInjectHeaders(): void
    {
        $message = ContactMessage::fromInput([
            'name' => "Jean\r\nBcc: victime@example.org\u{2028}X",
            'email' => 'jean@example.org',
            'message' => 'Bonjour',
        ]);

        self::assertNotNull($message);
        self::assertDoesNotMatchRegularExpression('/[\r\n\x{2028}]/u', $message->name);
        self::assertSame('Jean Bcc: victime@example.org X', $message->name);
    }

    public function testHtmlTagsAreStrippedFromName(): void
    {
        $message = ContactMessage::fromInput(['name' => '<b>Jean</b><script>alert(1)</script>', 'email' => 'jean@example.org', 'message' => 'Bonjour']);

        self::assertNotNull($message);
        self::assertStringNotContainsString('<', $message->name);
    }

    /** @param array<array-key, mixed> $input */
    #[DataProvider('invalidInputs')]
    public function testInvalidInputIsRejected(array $input): void
    {
        self::assertNull(ContactMessage::fromInput($input));
    }

    /** @return iterable<string, array{array<array-key, mixed>}> */
    public static function invalidInputs(): iterable
    {
        $ok = ['name' => 'Jean', 'email' => 'jean@example.org', 'message' => 'Bonjour'];

        yield 'nom vide' => [['name' => '  '] + $ok];
        yield 'nom trop long' => [['name' => str_repeat('a', ContactMessage::MAX_NAME + 1)] + $ok];
        yield 'message vide' => [['message' => ''] + $ok];
        yield 'message trop long' => [['message' => str_repeat('a', ContactMessage::MAX_MESSAGE + 1)] + $ok];
        yield 'e-mail absent' => [['email' => ''] + $ok];
        yield 'e-mail sans arobase' => [['email' => 'jean.example.org'] + $ok];
        yield 'e-mail avec espace' => [['email' => 'jean dupont@example.org'] + $ok];
        yield 'e-mail avec guillemets' => [['email' => '"jean"@example.org'] + $ok];
        yield 'e-mail avec liste' => [['email' => 'a@example.org,b@example.org'] + $ok];
        yield 'e-mail avec retour à la ligne' => [['email' => "jean@example.org\r\nBcc: x@example.org"] + $ok];
        yield 'e-mail trop long' => [['email' => str_repeat('a', 250) . '@example.org'] + $ok];
        yield 'types incorrects' => [['name' => ['Jean'], 'email' => 12, 'message' => null]];
        yield 'rien' => [[]];
    }
}
