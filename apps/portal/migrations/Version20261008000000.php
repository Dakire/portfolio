<?php

declare(strict_types=1);

namespace Grichard\Portal\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261008000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Utilisateurs de l\'espace client';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE app_user (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            email VARCHAR(180) NOT NULL,
            roles CLOB NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            last_login_at DATETIME DEFAULT NULL
        )');
        $this->addSql('CREATE UNIQUE INDEX uniq_app_user_email ON app_user (email)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE app_user');
    }
}
