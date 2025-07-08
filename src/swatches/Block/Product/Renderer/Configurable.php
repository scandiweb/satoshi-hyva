<?php

declare(strict_types=1);

namespace Satoshi\Swatches\Block\Product\Renderer;

use Magento\Swatches\Block\Product\Renderer\Configurable as SourceConfigurable;


class Configurable extends SourceConfigurable
{
    /**
     * Get Key for caching block content
     *
     * @return string
     * @since 100.1.0
     */
    public function getCacheKey()
    {
        return parent::getCacheKey() . '-' . $this->getData('is_popup');
    }
}
