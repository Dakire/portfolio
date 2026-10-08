<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

// Chemins relatifs du phpunit.xml : on les rend absolus pour ne pas dépendre du dossier courant.
foreach (['PORTAL_DB', 'PORTAL_VAR_DIR'] as $name) {
    $_SERVER[$name] = $_ENV[$name] = dirname(__DIR__) . '/' . ltrim((string) $_SERVER[$name], './');
}
