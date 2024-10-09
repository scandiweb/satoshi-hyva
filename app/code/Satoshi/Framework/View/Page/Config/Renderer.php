<?php

namespace Satoshi\Framework\View\Page\Config;

use Magento\Framework\View\Page\Config\Renderer as SourceRenderer;

/**
 * Page config Renderer model
 *
 * Extended to add page-meta comments in head
 */
class Renderer extends SourceRenderer
{

    /**
     * Render head content
     *
     * @return string
     */
    public function renderHeadContent()
    {
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
