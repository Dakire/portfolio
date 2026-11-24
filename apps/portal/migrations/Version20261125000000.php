<?php

declare(strict_types=1);

namespace Grichard\Portal\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Comptes clients : e-mail vérifié, double authentification, jetons à usage unique';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user ADD COLUMN verified_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE app_user ADD COLUMN totp_secret VARCHAR(64) DEFAULT NULL');
        $this->addSql('ALTER TABLE app_user ADD COLUMN backup_codes CLOB DEFAULT NULL');
        // Comptes existants (administrateur créé par /setup) : leur adresse est réputée vérifiée.
        $this->addSql('UPDATE app_user SET verified_at = created_at WHERE verified_at IS NULL');
        $this->addSql('CREATE TABLE user_token (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            created_at DATETIME NOT NULL,
            purpose VARCHAR(16) NOT NULL,
            token_hash VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            user_id INTEGER NOT NULL,
            CONSTRAINT FK_BDF55A63A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX idx_user_token_user ON user_token (user_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_user_token_hash ON user_token (token_hash)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE user_token');
        $this->addSql('ALTER TABLE app_user DROP COLUMN backup_codes');
        $this->addSql('ALTER TABLE app_user DROP COLUMN totp_secret');
        $this->addSql('ALTER TABLE app_user DROP COLUMN verified_at');
    }
}
