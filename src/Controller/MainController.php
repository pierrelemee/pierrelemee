<?php

namespace PierreLemee\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use DateTimeImmutable;
use Exception;

class MainController extends AbstractController
{
    const DATETIME_FORMAT = 'Y-m-d';
    const FALLBACK_AGE = 25;

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
            'age' => ($age = $this->howOldAmI()),
            'title' => "Pierre LEMÉE - Ingénieur logiciel en développement web basé à Paris - $age ans"
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
            'age' => ($age = $this->howOldAmI()),
            'title' => "Pierre LEMÉE - Software engineer in web development based in Paris- $age years old"
        ]);
    }

    /**
     * @return int
     */
    protected function howOldAmI(): int
    {
        try {
            return DateTimeImmutable::createFromFormat(self::DATETIME_FORMAT, $this->getParameter('dob'))->diff(new DateTimeImmutable())->y;
        } catch (Exception $e) {
            return self::FALLBACK_AGE;
        }
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