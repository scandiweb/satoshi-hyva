<?php

declare(strict_types=1);

namespace Satoshi\LayeredNavigation\Block\Navigation;

use Magento\Catalog\Model\Layer\Filter\FilterInterface;
use Magento\Framework\View\Element\Template;
use Magento\LayeredNavigation\Block\Navigation\FilterRendererInterface;

/**
 * Catalog layer filter renderer
 *
 * Extended to pass attribute code
 */
class FilterRenderer extends Template implements FilterRendererInterface
{
    /**
     * @param FilterInterface $filter
     * @return string
     */
    public function render(FilterInterface $filter)
    {
        $this->assign('filterItems', $filter->getItems());
        $this->assign('attribute_code', $filter->getAttributeModel()->getAttributeCode());
        $html = $this->_toHtml();
        $this->assign('filterItems', []);
        $this->assign('attribute_code', null);
        return $html;
    }
}
