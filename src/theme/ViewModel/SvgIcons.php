<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Magento\Framework\App\CacheInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Math\Random as MathRandom;
use Magento\Framework\View\Asset;
use Magento\Framework\View\DesignInterface;
use Hyva\Theme\ViewModel\SvgIcons as SourceSvgIcons;

/**
 * Override SvgIcons to prevent the addition of a <title> element to the SVG
 * if the title attribute is not explicitly provided.
 */
class SvgIcons extends SourceSvgIcons
{
    public const CACHE_TAG = 'HYVA_ICONS';

    /**
     * Module name prefix for icon asset, e.g. Hyva_Theme::svg
     *
     * @var string
     */
    private $iconPathPrefix;

    /**
     * Human friendly alias for iconPathPrefixes
     *
     * @var string[]
     */
    private $pathPrefixMapping;

    /**
     * Optional folder name to be appended to the $iconPathPrefix
     *
     * @var string
     */
    private $iconSet = '';

    /**
     * @var Asset\Repository
     */
    private $assetRepository;

    /**
     * @var CacheInterface
     */
    private $cache;

    /**
     * @var DesignInterface
     */
    private $design;

    /**
     * Global counter for how many times SVG internal IDs is rendered.
     *
     * @var  int[]
     * @see self::disambiguateSvgIds
     */
    private static $internalIdUsageCounts = [];

    public function __construct(
        Asset\Repository $assetRepository,
        CacheInterface   $cache,
        DesignInterface  $design,
        string           $iconPathPrefix = 'Hyva_Theme::svg',
        string           $iconSet = '',
        array            $pathPrefixMapping = []
    )
    {
        $this->assetRepository = $assetRepository;
        $this->cache = $cache;
        $this->design = $design;
        $this->iconPathPrefix = rtrim($iconPathPrefix, '/');
        $this->iconSet = $iconSet;
        $this->pathPrefixMapping = $pathPrefixMapping;

        parent::__construct(
            $assetRepository,
            $cache,
            $design,
            $iconPathPrefix,
            $iconSet,
            $pathPrefixMapping
        );
    }

    /**
     * Renders an inline SVG icon from the configured icon set
     *
     * The method ends with Html instead of Svg so that the Magento code sniffer understands it is safe HTML and does
     * not need to be escaped.
     *
     * @param string $icon The SVG file name without .svg suffix
     * @param string $classNames CSS classes to add to the root element, space separated
     * @param int|null $width Width in px (recommended to render in correct size without CSS)
     * @param int|null $height Height in px (recommended to render in correct size without CSS)
     * @param array $attributes Additional attributes you can set on the SVG as key => value, like :class for AlpineJS
     * @return string
     */
    public function renderHtml(
        string $icon,
        string $classNames = '',
        ?int   $width = 24,
        ?int   $height = 24,
        array  $attributes = []
    ): string
    {
        if (!$this->isAriaHidden($attributes) && !isset($attributes['role'])) {
            $attributes['role'] = 'img';
        }

        $iconPath = $this->applyPathPrefixAndIconSet($icon);

        $cacheKey = $this->design->getDesignTheme()->getCode() .
            '/' . $iconPath .
            '/' . $classNames .
            '#' . $width .
            '#' . $height .
            '#' . hash('md5', json_encode($attributes));

        if ($result = $this->cache->load($cacheKey)) {
            return $this->withMaskedAlpineAttributes($result, [$this, 'disambiguateSvgIds']);
        }

        try {
            $rawIconSvg = \file_get_contents($this->getFilePath($iconPath)); // phpcs:disable
            $result = $this->withMaskedAlpineAttributes($rawIconSvg, function (string $rawIconSvg) use ($icon, $attributes, $height, $width, $classNames): string {
                return $this->applySvgArguments($rawIconSvg, $classNames, $width, $height, $attributes, $icon);
            });

            $this->cache->save($result, $cacheKey, [self::CACHE_TAG]);

            return $this->withMaskedAlpineAttributes($result, [$this, 'disambiguateSvgIds']);
        } catch (Asset\File\NotFoundException $exception) {
            $error = (string)__('Unable to find the SVG icon "%1"', $icon);
            throw new Asset\File\NotFoundException($error, 0, $exception);
        }
    }

    private function disambiguateSvgIds(string $svgContent): string
    {
        $svgXml = new \SimpleXMLElement($svgContent);
        $idAttributes = $svgXml->xpath('/*/*//@id');
        $uniqueIdList = [];
        foreach ($idAttributes as $idAttr) {
            $id = (string)$idAttr->id;
            if (isset(self::$internalIdUsageCounts[$id])) {
                $uniqueId = $id . '_' . (++self::$internalIdUsageCounts[$id]);
                $uniqueIdList['#' . $id] = '#' . $uniqueId;
                $idAttr->id = $uniqueId;
            } else {
                self::$internalIdUsageCounts[$id] = 1;
            }
        }
        $svgContent = \str_replace("<?xml version=\"1.0\"?>\n", '', $svgXml->asXML());
        return str_replace(array_keys($uniqueIdList), array_values($uniqueIdList), $svgContent);
    }

    /**
     * Return absolute path to icon file, respecting theme fallback.
     *
     * If no matching icon within the given iconPathPrefix module is found, it will fall back to the theme web folder.
     */
    private function getFilePath(string $iconPath): string
    {
        $asset = $this->assetRepository->createAsset($iconPath);
        try {
            // try to locate asset with iconPathPrefix (e.g. Hyva_Theme::svg)
            $path = $asset->getSourceFile();
        } catch (Asset\File\NotFoundException $exception) {
            // fallback to web/ folder in current theme if not found
            $path = $this->assetRepository->createAsset($asset->getFilePath())->getSourceFile();
        }
        return $path;
    }

    private function applyPathPrefixAndIconSet(string $icon): string
    {
        $iconSet = $this->iconSet ? $this->iconSet . '/' : '';
        $iconPathParts = explode('/', $icon, 2);

        return count($iconPathParts) === 2 && isset($this->pathPrefixMapping[$iconPathParts[0]])
            ? $this->pathPrefixMapping[$iconPathParts[0]] . '/' . $iconSet . $iconPathParts[1] . '.svg'
            : $this->iconPathPrefix . '/' . $iconSet . $icon . '.svg';
    }

    private function applySvgArguments(
        string $origSvg,
        string $classNames,
        ?int   $width,
        ?int   $height,
        array  $attributes,
        string $icon
    ): string
    {
        $svgXml = new \SimpleXMLElement($origSvg);
        if (trim($classNames)) {
            $svgXml['class'] = $classNames;
        }
        if ($width) {
            $svgXml['width'] = (string)$width;
        }
        if ($height) {
            $svgXml['height'] = (string)$height;
        }

        if (!empty($attributes)) {
            foreach ($attributes as $key => $value) {
                if (!empty($key) && $key !== 'title' && !isset($svgXml[strtolower($key)])) {
                    $svgXml[strtolower($key)] = is_bool($value)
                        ? ($value ? 'true' : 'false')
                        : (string)$value;
                }
            }
        }

        if (!$this->isAriaHidden($attributes) && !$this->hasTitle($svgXml) && isset($attributes['title'])) {
            $svgXml->addChild('title', (string)($attributes['title']));
        }

        $xml = $svgXml->asXML();

        return \str_replace("<?xml version=\"1.0\"?>\n", '', $xml);
    }

    private function hasTitle(\SimpleXMLElement $svgXml): bool
    {
        foreach ($svgXml->children() as $child) {
            if ($child->getName() === 'title') {
                return true;
            }
        }
        return false;
    }

    private function isAriaHidden($attributes): bool
    {
        return (array_key_exists('aria-hidden', $attributes) &&
            ($attributes['aria-hidden'] === true || $attributes['aria-hidden'] === 'true'));
    }

    private function generateMaskString(array $otherMasks): string
    {
        $mathRandom = ObjectManager::getInstance()->get(MathRandom::class);
        do {
            $mask = $mathRandom->getRandomString(32, $mathRandom::CHARS_LOWERS);
        } while (isset($otherMasks[$mask]));

        return $mask;
    }

    private function withMaskedAlpineAttributes(string $content, callable $fn): string
    {
        $maskedAttributes = [];

        while (preg_match('/<[a-zA-Z][^>]+?\s([@:][a-z][^=]*)=/', $content, $matches)) {
            $mask = $this->generateMaskString($maskedAttributes);
            $maskedAttributes[$mask] = $matches[1];
            $content = str_replace($matches[1], $mask, $content);
        }

        $content = $fn($content);

        return str_replace(array_keys($maskedAttributes), array_values($maskedAttributes), $content);
    }
}
