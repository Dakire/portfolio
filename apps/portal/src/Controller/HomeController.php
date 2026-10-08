<?php

declare(strict_types=1);

namespace Grichard\Portal\Controller;

use Grichard\Portal\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home', methods: ['GET'])]
    public function index(): Response
    {
        $user = $this->getUser();
        \assert($user instanceof User);

        return $this->render('home/index.html.twig', ['user' => $user]);
    }
}
