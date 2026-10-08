<?php

declare(strict_types=1);

// Style PER Coding Style (successeur de PSR-12) + règles de rigueur : types stricts, imports triés, pas de code mort.
$finder = (new PhpCsFixer\Finder())->in([__DIR__ . '/src', __DIR__ . '/public', __DIR__ . '/tests']);

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@PER-CS' => true,
        '@PHP8x4Migration' => true,
        'declare_strict_types' => true,
        'strict_comparison' => true,
        'ordered_imports' => true,
        'no_unused_imports' => true,
        'native_function_invocation' => ['include' => ['@compiler_optimized'], 'scope' => 'namespaced'],
    ])
    ->setFinder($finder);
