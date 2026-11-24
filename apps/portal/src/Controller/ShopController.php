<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Grichard\Portal\Catalog\Catalog;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/** Aperçu privé de la boutique (ADR 0017) : réservé aux comptes connectés par la règle « ^/ » de security.yaml. */
final class ShopController extends AbstractController
{
    #[Route('/boutique', name: 'app_shop', methods: ['GET'])]
    public function index(Catalog $catalog): Response
    {
        return $this->render('shop/index.html.twig', ['products' => $catalog->all()]);
    }
}
