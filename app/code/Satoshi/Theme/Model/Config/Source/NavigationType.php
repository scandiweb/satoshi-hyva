<?php

namespace Satoshi\Theme\Model\Config\Source;

class NavigationType implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * Get options for navigation type
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            ['value' => 'SPA', 'label' => __('Single Page Application (SPA)')],
            ['value' => 'MPA', 'label' => __('Multi Page Application (MPA)')]
        ];
    }
}
