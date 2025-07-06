<?php

namespace Satoshi\Framework\View\Page\Config;

use Magento\Framework\View\Page\Config\Renderer as SourceRenderer;
use Magento\Framework\View\Page\Config;
use Magento\Framework\View\Page\Config\Metadata\MsApplicationTileImage;
use Psr\Log\LoggerInterface;
use Magento\Framework\UrlInterface;
use Magento\Framework\Escaper;
use Magento\Framework\Stdlib\StringUtils;
use Magento\Framework\View\Asset\MergeService;
use Satoshi\Core\Helper\IsThemeActive;

/**
 * Page config Renderer model
 *
 * Extended to add page-meta comments in head
 */
class Renderer extends SourceRenderer
{

    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @param Config $pageConfig
     * @param MergeService $assetMergeService
     * @param UrlInterface $urlBuilder
     * @param Escaper $escaper
     * @param StringUtils $string
     * @param LoggerInterface $logger
     * @param MsApplicationTileImage|null $msApplicationTileImage
     * @param IsThemeActive $isThemeActive
     */
    public function __construct(
        Config $pageConfig,
        MergeService $assetMergeService,
        UrlInterface $urlBuilder,
        Escaper $escaper,
        StringUtils $string,
        LoggerInterface $logger,
        IsThemeActive $isThemeActive,
        ?MsApplicationTileImage $msApplicationTileImage = null
    ) {
        $this->isThemeActive = $isThemeActive;
        parent::__construct(
            $pageConfig,
            $assetMergeService,
            $urlBuilder,
            $escaper,
            $string,
            $logger,
            $msApplicationTileImage
        );
    }

    /**
     * Render head content
     *
     * @return string
     */
    public function renderHeadContent()
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::renderHeadContent();
        }

        $result = '<!-- page-meta -->';
        $result .= $this->renderMetadata();
        $result .= $this->renderTitle();
        $result .= '<!-- end-page-meta -->';
        $this->prepareFavicon();
        $result .= $this->renderAssets($this->getAvailableResultGroups());
        $result .= $this->pageConfig->getIncludes();
        return $result;
    }
}
