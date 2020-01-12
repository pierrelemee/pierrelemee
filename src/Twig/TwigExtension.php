<?php

namespace PierreLemee\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use ParsedownExtra;
use Twig\TwigFunction;

class TwigExtension extends AbstractExtension
{
    /**
     * @var ParsedownExtra $parsedown
     */
    protected $parsedown;
    /**
     * @var string $markdownDirectory
     */
    protected $markdownDirectory;

    public function __construct(ParsedownExtra $parsedown, string $markdownDirectory)
    {
        $this->parsedown = $parsedown;
        $this->markdownDirectory = realpath($markdownDirectory) ?? __DIR__;
    }

    public function getFilters()
    {
        return [
            new TwigFilter('md', [$this, 'markdownText']),
            new TwigFilter('markdown', [$this, 'markdownText']),
        ];
    }

    public function getFunctions()
    {
        return [
            new TwigFunction('markdown', [$this, 'markdownFile']),
            new TwigFunction('md', [$this, 'markdownFile']),
        ];
    }

    /**
     * @param string $text
     *
     * @return string
     */
    public function markdownText(string $text)
    {
        return $this->parsedown->text($text);
    }

    /**
     * @param string $file
     * @param string $language
     *
     * @return string
     */
    public function markdownFile(string $file, string $language = 'fr')
    {
        if (is_file($file) || is_file($file = "{$this->markdownDirectory}/{$language}/{$file}")) {
            return $this->parsedown->text(file_get_contents($file));
        }

        return '';
    }
}