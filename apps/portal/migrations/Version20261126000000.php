<?php

declare(strict_types=1);

namespace Grichard\Portal\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261126000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Boutique : licences et notifications Paddle déjà traitées';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE licence (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            licence_key VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL,
            valid_until DATETIME DEFAULT NULL,
            updates_until DATETIME DEFAULT NULL,
            paddle_subscription_id VARCHAR(64) DEFAULT NULL,
            paddle_transaction_id VARCHAR(64) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            email VARCHAR(180) NOT NULL,
            product VARCHAR(64) NOT NULL,
            "plan" VARCHAR(32) NOT NULL,
            user_id INTEGER DEFAULT NULL,
            CONSTRAINT FK_1DAAE648A76ED395 FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE
        )');
        $this->addSql('CREATE INDEX idx_licence_user ON licence (user_id)');
        $this->addSql('CREATE INDEX idx_licence_subscription ON licence (paddle_subscription_id)');
        $this->addSql('CREATE INDEX idx_licence_transaction ON licence (paddle_transaction_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_licence_key ON licence (licence_key)');
        $this->addSql('CREATE TABLE webhook_event (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            received_at DATETIME NOT NULL,
            event_id VARCHAR(64) NOT NULL,
            event_type VARCHAR(64) NOT NULL
        )');
        $this->addSql('CREATE UNIQUE INDEX uniq_webhook_event ON webhook_event (event_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE webhook_event');
        $this->addSql('DROP TABLE licence');
    }
}
