<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Model\Filter;

use Magento\PageBuilder\Model\Filter\Template as SourceTemplate;
use DOMDocument;
use DOMElement;
use DOMException;
use DOMXPath;
use Exception;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Math\Random;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\ConfigInterface;
use Magento\PageBuilder\Plugin\Filter\TemplatePlugin;
use Psr\Log\LoggerInterface;
use Magento\Framework\View\LayoutInterface;

class Template extends SourceTemplate
{
    const PAGE_BUILDER_IGNORED_TEMPLATE_PATTERN = '/\sdata-is-page-builder-ignored-element/si';
    const DEFAULT_LAZY_LOAD_FIRST_IMAGE = true;
    const DEFAULT_IMAGE_EXPAND = '-20';

    /**
     * @var ConfigInterface
     */
    protected $viewConfig;

    /**
     * @var LoggerInterface
     */
    protected $logger;

    /**
     * @var DOMDocument
     */
    protected $domDocument;

    /**
     * @var Random
     */
    protected $mathRandom;

    /**
     * @var Json
     */
    protected $json;

    /**
     * @var array
     */
    protected $scripts;

    /**
     * @var LayoutInterface
     */
    protected $layout;

    /**
     * @var string
     */
    protected $imageLazyLoadExpand;

    /**
     * @var string
     */
    protected $backgroundImageLazyLoadExpand;

    /**
     * @param LoggerInterface $logger
     * @param ConfigInterface $viewConfig
     * @param Random $mathRandom
     * @param Json $json
     */
    public function __construct(
        LoggerInterface $logger,
        ConfigInterface $viewConfig,
        Random $mathRandom,
        Json $json,
        LayoutInterface $layout,
        string $imageLazyLoadExpand = self::DEFAULT_IMAGE_EXPAND,
        string $backgroundImageLazyLoadExpand = self::DEFAULT_IMAGE_EXPAND
    ) {
        parent::__construct(
            $logger,
            $viewConfig,
            $mathRandom,
            $json
        );

        $this->logger = $logger;
        $this->viewConfig = $viewConfig;
        $this->mathRandom = $mathRandom;
        $this->json = $json;
        $this->layout = $layout;
        $this->imageLazyLoadExpand = $imageLazyLoadExpand;
        $this->backgroundImageLazyLoadExpand = $backgroundImageLazyLoadExpand;
    }

    public function filter(string $result) : string
    {
        $this->domDocument = false;
        $this->scripts = [];
        $document = null;

        // View (#remove-page-builder-ignored-element-comment) comment
        if (preg_match(self::PAGE_BUILDER_IGNORED_TEMPLATE_PATTERN, $result)) {
            if (!$document) {
                $document = $this->getDomDocument($result);
            }

            $this->removePageBuilderIgnoredElements($document);
        }

        // Validate if the filtered result requires background image processing
        if (preg_match(TemplatePlugin::BACKGROUND_IMAGE_PATTERN, $result)) {
            if (!$document) {
                $document = $this->getDomDocument($result);
            }

            $this->generateBackgroundImageStyles($document);
        }

        // Process any HTML content types, they need to be decoded on the front-end
        if (preg_match(TemplatePlugin::HTML_CONTENT_TYPE_PATTERN, $result)) {
            if (!$document) {
                $document = $this->getDomDocument($result);
            }

            $uniqueNodeNameToDecodedOuterHtmlMap = $this->generateDecodedHtmlPlaceholderMappingInDocument($document);
        }

        // If a document was retrieved we've modified the output so need to retrieve it from within the document
        if (isset($document)) {
            // Match the contents of the body from our generated document
            preg_match(
                '/<body>(.+)<\/body><\/html>$/si',
                $document->saveHTML(),
                $matches
            );

            if (!empty($matches)) {
                $docHtml = $matches[1];

                // restore any encoded directives
                $docHtml = preg_replace_callback(
                    '/=\"(%7B%7B[^"]*%7D%7D)\"/m',
                    function ($matches) {
                        return urldecode($matches[0]);
                    },
                    $docHtml
                );

                if (isset($uniqueNodeNameToDecodedOuterHtmlMap)) {
                    foreach ($uniqueNodeNameToDecodedOuterHtmlMap as $uniqueNodeName => $decodedOuterHtml) {
                        $docHtml = str_replace(
                            '<' . $uniqueNodeName . '>' . '</' . $uniqueNodeName . '>',
                            $decodedOuterHtml,
                            $docHtml
                        );
                    }
                }

                $result = $docHtml;
            }

            $result = $this->unmaskScriptTags($result);
        }

        return $result;
    }

    /**
     * Create a DOM document from a given string
     *
     * @param string $html
     *
     * @return DOMDocument
     */
    protected function getDomDocument(string $html) : DOMDocument
    {
        if (!$this->domDocument) {
            $this->domDocument = $this->createDomDocument($html);
        }

        return $this->domDocument;
    }

    /**
     * Create a DOMDocument from a string
     *
     * @param string $html
     *
     * @return DOMDocument
     */
    protected function createDomDocument(string $html) : DOMDocument
    {
        $html = $this->maskScriptTags($html);

        $domDocument = new DOMDocument('1.0', 'UTF-8');
        set_error_handler(
            function ($errorNumber, $errorString) {
                throw new DOMException($errorString, $errorNumber);
            }
        );
        $convmap = [0x80, 0x10FFFF, 0, 0x1FFFFF];
        $string = mb_encode_numericentity(
            $html,
            $convmap,
            'UTF-8'
        );
        try {
            libxml_use_internal_errors(true);
            // LIBXML_SCHEMA_CREATE option added according to this message
            // https://stackoverflow.com/a/66473950/773018
            // Its need to avoid bug described in maskScriptTags()
            // https://bugs.php.net/bug.php?id=52012
            $domDocument->loadHTML(
                '<html><body>' . $string . '</body></html>',
                LIBXML_SCHEMA_CREATE
            );
            libxml_clear_errors();
        } catch (Exception $e) {
            restore_error_handler();
            $this->logger->critical($e);
        }
        restore_error_handler();

        return $domDocument;
    }

    /**
     * Convert encoded HTML content types to placeholders and generate decoded outer html map for future replacement
     *
     * @param DOMDocument $document
     * @return array
     * @throws LocalizedException
     */
    protected function generateDecodedHtmlPlaceholderMappingInDocument(DOMDocument $document): array
    {
        $xpath = new DOMXPath($document);

        // construct xpath query to fetch top-level ancestor html content type nodes
        /** @var $htmlContentTypeNodes DOMNode[] */
        $htmlContentTypeNodes = $xpath->query(
            '//*[@data-content-type="html" and not(@data-decoded="true")]' .
            '[not(ancestor::*[@data-content-type="html"])]'
        );

        $uniqueNodeNameToDecodedOuterHtmlMap = [];

        foreach ($htmlContentTypeNodes as $htmlContentTypeNode) {
            // Set decoded attribute on all encoded html content types so we don't double decode;
            $htmlContentTypeNode->setAttribute('data-decoded', 'true');

            // if nothing exists inside the node, continue
            if (!strlen(trim($htmlContentTypeNode->nodeValue))) {
                continue;
            }

            // clone html code content type to save reference to its attributes/outerHTML, which we are not going to
            // decode
            $clonedHtmlContentTypeNode = clone $htmlContentTypeNode;

            // clear inner contents of cloned node for replacement later with $decodedInnerHtml using sprintf;
            // we want to retain html content type node and avoid doing any manipulation on it
            $clonedHtmlContentTypeNode->nodeValue = '%s';

            // remove potentially harmful attributes on html content type node itself
            while ($htmlContentTypeNode->attributes->length) {
                $htmlContentTypeNode->removeAttribute($htmlContentTypeNode->attributes->item(0)->name);
            }

            // decode outerHTML safely
            $preDecodedOuterHtml = $document->saveHTML($htmlContentTypeNode);

            // clear empty <div> wrapper around outerHTML to replace with $clonedHtmlContentTypeNode
            // phpcs:ignore Magento2.Functions.DiscouragedFunction
            $decodedInnerHtml = preg_replace('#^<[^>]*>|</[^>]*>$#', '', html_entity_decode($preDecodedOuterHtml));

            // Use $clonedHtmlContentTypeNode's placeholder to inject decoded inner html
            $decodedOuterHtml = sprintf($document->saveHTML($clonedHtmlContentTypeNode), $decodedInnerHtml);

            // generate unique node name element to replace with decoded html contents at end of processing;
            // goal is to create a document as few times as possible to prevent inadvertent parsing of contents as html
            // by the dom library
            $uniqueNodeName = $this->mathRandom->getRandomString(32, $this->mathRandom::CHARS_LOWERS);

            $uniqueNode = new DOMElement($uniqueNodeName);
            $htmlContentTypeNode->parentNode->replaceChild($uniqueNode, $htmlContentTypeNode);

            $uniqueNodeNameToDecodedOuterHtmlMap[$uniqueNodeName] = $decodedOuterHtml;
        }

        return $uniqueNodeNameToDecodedOuterHtmlMap;
    }

    protected function addBackgroundImageStyle($node, $elementClass, $isLazyLoading = true)
    {
        // Append our new class to the DOM element
        $classes = '';

        if ($node->attributes->getNamedItem('class')) {
            $classes = $node->attributes->getNamedItem('class')->nodeValue . ' ';
        }

        if ($isLazyLoading) {
            $node->setAttribute('class', $classes . 'lazyload');
            $node->setAttribute('data-expand', $this->backgroundImageLazyLoadExpand);
            $node->setAttribute('data-background-images-class', $elementClass);
        } else {
            $node->setAttribute('class', $classes . $elementClass);
        }
    }

    protected function generateAndAddBackgroundImageStyles($xpath, $elements, $isLazyLoading, $isLazyLoadFirstImage = self::DEFAULT_LAZY_LOAD_FIRST_IMAGE)
    {
        foreach ($elements as $index => $node) {
            /* @var DOMElement $node */
            $backgroundImages = $node->attributes->getNamedItem('data-background-images');

            if ($backgroundImages->nodeValue !== '') {
                $elementClass = uniqid('background-image-');
                // phpcs:ignore Magento2.Functions.DiscouragedFunction
                $images = $this->json->unserialize(stripslashes($backgroundImages->nodeValue));

                if (count($images) > 0) {
                    $style = $xpath->document->createElement(
                        'style',
                        $this->generateCssFromImages($elementClass, $images)
                    );

                    $style->setAttribute('type', 'text/css');
                    $node->parentNode->appendChild($style);

                    if (!$isLazyLoadFirstImage && $index === 0) {
                        $this->addBackgroundImageStyle($node, $elementClass, false);
                    } else {
                        $this->addBackgroundImageStyle($node, $elementClass, $isLazyLoading);
                    }
                }
            }
        }
    }

    /**
     * Generate the CSS for any background images on the page
     *
     * @param DOMDocument $document
     */
    protected function generateBackgroundImageStyles(DOMDocument $document) : void
    {
        $xpath = new DOMXPath($document);
        $sliderElements = $xpath->query('//*[contains(@class, "pagebuilder-slider")]');
        $backgroundImageElementsOtherThanSliderElements = $xpath->query('//*[@data-background-images][not(ancestor::*[contains(@class, "pagebuilder-slider")])]');

        $this->generateAndAddBackgroundImageStyles($xpath, $backgroundImageElementsOtherThanSliderElements, true);

        /**
         * @var DOMElement $sliderElement
         */
        foreach ($sliderElements as $sliderElement) {
            $isLazyLoadFirstImageAttribute = $sliderElement->attributes->getNamedItem('data-lazy-load-first-image');

            if ($isLazyLoadFirstImageAttribute) {
                $isLazyLoadFirstImage = ($isLazyLoadFirstImageAttribute->nodeValue === 'true');
            } else {
                $isLazyLoadFirstImage = self::DEFAULT_LAZY_LOAD_FIRST_IMAGE;
            }

            $sliderBackgroundImageElements = $xpath->query('//*[@data-background-images][contains(@class, "pagebuilder-slide-wrapper")]', $sliderElement);

            $this->generateAndAddBackgroundImageStyles($xpath, $sliderBackgroundImageElements, true, $isLazyLoadFirstImage);
        }
    }

    /**
     * Remove element with "data-is-page-builder-ignored-element" attribute set to "true"
     * to reduce DOM size on front end to improve performance.
     * The element is needed for page builder form.
     * (#remove-page-builder-ignored-element-comment)
     *
     * @param DOMDocument $document
     */
    protected function removePageBuilderIgnoredElements(DOMDocument $document) : void
    {
        $xpath = new DOMXPath($document);
        $pageBuilderIgnoredElements = $xpath->query('//*[@data-is-page-builder-ignored-element]');

        /**
         * @var DOMElement $pageBuilderIgnoredElement
         */
        foreach ($pageBuilderIgnoredElements as $pageBuilderIgnoredElement) {
            $pageBuilderIgnoredElementAttributeData = $pageBuilderIgnoredElement->attributes->getNamedItem('data-is-page-builder-ignored-element');

            if ($pageBuilderIgnoredElementAttributeData->nodeValue !== 'false') {
                $pageBuilderIgnoredElement->remove();
            }
        }
    }

    /**
     * Generate CSS based on the images array from our attribute
     *
     * @param string $elementClass
     * @param array $images
     *
     * @return string
     */
    protected function generateCssFromImages(string $elementClass, array $images) : string
    {
        $css = [];
        if (isset($images['desktop_image'])) {
            $css['.' . $elementClass] = [
                'background-image' => 'url(' . $images['desktop_image'] . ')',
            ];
        }
        if (isset($images['mobile_image']) && $this->getMediaQuery('mobile')) {
            $css[$this->getMediaQuery('mobile')]['.' . $elementClass] = [
                'background-image' => 'url(' . $images['mobile_image'] . ')',
            ];
        }
        if (isset($images['mobile_image']) && $this->getMediaQuery('mobile-small')) {
            $css[$this->getMediaQuery('mobile-small')]['.' . $elementClass] = [
                'background-image' => 'url(' . $images['mobile_image'] . ')',
            ];
        }
        return $this->cssFromArray($css);
    }

    /**
     * Generate a CSS string from an array
     *
     * @param array $css
     *
     * @return string
     */
    protected function cssFromArray(array $css) : string
    {
        $output = '';
        foreach ($css as $selector => $body) {
            if (is_array($body)) {
                $output .= $selector . ' {';
                $output .= $this->cssFromArray($body);
                $output .= '}';
            } else {
                $output .= $selector . ': ' . $body . ';';
            }
        }
        return $output;
    }

    /**
     * Generate the mobile media query from view configuration
     *
     * @param string $view
     * @return null|string
     */
    protected function getMediaQuery(string $view) : ?string
    {
        $breakpoints = $this->viewConfig->getViewConfig()->getVarValue(
            'Magento_PageBuilder',
            'breakpoints/' . $view . '/conditions'
        );
        if ($breakpoints && count($breakpoints) > 0) {
            $mobileBreakpoint = '@media only screen ';
            foreach ($breakpoints as $key => $value) {
                $mobileBreakpoint .= 'and (' . $key . ': ' . $value . ') ';
            }
            return rtrim($mobileBreakpoint);
        }
        return null;
    }

    /**
     * Masks "x-magento-template" script tags in html content before loading it into DOM parser
     *
     * DOMDocument::loadHTML() will remove any closing tag inside script tag and will result in broken html template
     *
     * @param string $content
     * @return string
     * @see https://bugs.php.net/bug.php?id=52012
     */
    protected function maskScriptTags(string $content): string
    {
        $tag = 'script';
        $content = preg_replace_callback(
            sprintf('#<%1$s[^>]*type="text/x-magento-template\"[^>]*>.*?</%1$s>#is', $tag),
            function ($matches) {
                $key = $this->mathRandom->getRandomString(32, $this->mathRandom::CHARS_LOWERS);
                $this->scripts[$key] = $matches[0];
                return '<' . $key . '>' . '</' . $key . '>';
            },
            $content
        );
        return $content;
    }

    /**
     * Replaces masked "x-magento-template" script tags with their corresponding content
     *
     * @param string $content
     * @return string
     * @see maskScriptTags()
     */
    protected function unmaskScriptTags(string $content): string
    {
        foreach ($this->scripts as $key => $script) {
            $content = str_replace(
                '<' . $key . '>' . '</' . $key . '>',
                $script,
                $content
            );
        }
        return $content;
    }
}
