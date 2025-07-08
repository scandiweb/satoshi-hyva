<?php

declare(strict_types=1);

namespace Satoshi\LayeredNavigation\Block\Navigation;

use Magento\Catalog\Model\Layer\Filter\FilterInterface;
use Magento\LayeredNavigation\Block\Navigation\FilterRenderer as BaseFilterRenderer;
use Satoshi\Core\Helper\IsThemeActive;

/**
 * Catalog layer filter renderer
 *
 * Extended to pass attribute code
 */
class FilterRenderer extends BaseFilterRenderer
{
    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * Constructor
     *
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param array $data
     */
    public function __construct(\Magento\Framework\View\Element\Template\Context $context, IsThemeActive $isThemeActive, array $data = [])
    {
        $this->isThemeActive = $isThemeActive;
        parent::__construct($context, $data);
    }

    /**
     * @param FilterInterface $filter
     * @return string
     */
    public function render(FilterInterface $filter)
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::render($filter);
        }
        
        $this->assign('filterItems', $filter->getItems());
        $this->assign('filter', $filter);
        $html = $this->_toHtml();
        $this->assign('filterItems', []);
        $this->assign('filter', null);
        return $html;
    }
}
