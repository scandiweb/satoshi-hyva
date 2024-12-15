<?php

namespace Satoshi\Bundle\Block\Catalog\Product\View\Type;

use Magento\Bundle\Block\Catalog\Product\View\Type\Bundle as SourceBundle;
use Magento\Bundle\Model\Option;

class Bundle extends SourceBundle
{
    /**
     * Get html for option
     *
     * @param Option $option
     * @return string
     */
    public function getOptionHtml(Option $option)
    {
        $optionBlock = $this->getChildBlock($option->getType());
        if (!$optionBlock) {
            return __('There is no defined renderer for "%1" option type.', $this->escapeHtml($option->getType()));
        }
        return $optionBlock->setProduct($this->getProduct())->setOption($option)->setIsPopup($this->getIsPopup() ?? false)->toHtml();
    }
}
