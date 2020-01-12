<?php

namespace PierreLemee\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class MainController extends AbstractController
{
    /**
     * @Route("", name="main_index")
     *
     * @param Request $request
     *
     * @return Response
     */
    public function index(Request $request)
    {
        if ($this->requestSupportsLanguage($request, ['fr', 'fr-FR'])) {
            return $this->redirectToRoute('main_resume_fr');
        }

        return $this->redirectToRoute('main_resume_en');
    }

    /**
     * @Route("/fr", name="main_resume_fr")
     *
     * @return Response
     */
    public function resumeFr(): Response
    {
        return $this->render('resume.html.twig', [
            'language' => 'fr',
            'title' => "Pierre LEMÉE - Ingénieur logiciel - 33"
        ]);
    }

    /**
     * @Route("/en", name="main_resume_en")
     *
     * @return Response
     */
    public function resumeEn(): Response
    {
        return $this->render('resume.html.twig', [
            'language' => 'en',
            'title' => "Pierre LEMÉE - Software engineer - 33"
        ]);
    }

    /**
     * @param Request $request
     * @param string[] $languages
     *
     * @return bool
     */
    protected function requestSupportsLanguage(Request $request, array $languages = []): bool
    {
        return !empty(
            array_intersect(
                array_map(
                    function (string $prefer) {
                        if (count($elements = explode(';', $prefer)) > 1) {
                            return trim($elements[0]);
                        }

                        return trim($prefer);
                    },
                    explode(',', $request->headers->get('Accept-Language', ''))
                ),
                $languages
            )
        );
    }
}