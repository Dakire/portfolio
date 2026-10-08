<?php

declare(strict_types=1);

namespace Grichard\Portal\Setup;

use Doctrine\Migrations\DependencyFactory;
use Doctrine\Migrations\Exception\NoMigrationsToExecute;
use Doctrine\Migrations\Metadata\AvailableMigration;
use Doctrine\Migrations\MigratorConfiguration;

/**
 * Migrations de base de données lancées depuis le navigateur : l'hébergement n'offre pas de ligne de commande.
 * Appelé par la page d'installation (première fois) puis par /admin/maintenance (réservée aux administrateurs).
 */
final readonly class MigrationRunner
{
    public function __construct(private DependencyFactory $migrations) {}

    /** @return list<string> versions pas encore appliquées */
    public function pending(): array
    {
        $this->migrations->getMetadataStorage()->ensureInitialized();

        return array_values(array_map(
            static fn(AvailableMigration $migration): string => (string) $migration->getVersion(),
            $this->migrations->getMigrationStatusCalculator()->getNewMigrations()->getItems(),
        ));
    }

    public function currentVersion(): string
    {
        $executed = $this->migrations->getMetadataStorage()->getExecutedMigrations()->getItems();
        $last = end($executed);

        return false === $last ? 'aucune' : (string) $last->getVersion();
    }

    /** @return int nombre de migrations appliquées */
    public function migrate(): int
    {
        $count = \count($this->pending());
        if (0 === $count) {
            return 0;
        }

        try {
            $latest = $this->migrations->getVersionAliasResolver()->resolveVersionAlias('latest');
            $plan = $this->migrations->getMigrationPlanCalculator()->getPlanUntilVersion($latest);
            $this->migrations->getMigrator()->migrate($plan, new MigratorConfiguration());
        } catch (NoMigrationsToExecute) {
            return 0;
        }

        return $count;
    }
}
