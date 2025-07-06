<?php

declare(strict_types=1);

namespace Satoshi\Customer\Block\Account;

use Magento\Customer\Block\Account\SortLink as SourceSortLink;
use Magento\Framework\App\DefaultPathInterface;
use Magento\Framework\View\Element\Template\Context;
use Satoshi\Core\Helper\IsThemeActive;

class SortLink extends SourceSortLink
{
    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * Constructor
     *
     * @param Context $context
     * @param DefaultPathInterface $defaultPath
     * @param array $data
     */
    public function __construct(
        Context $context,
        DefaultPathInterface $defaultPath,
        IsThemeActive $isThemeActive,
        array $data = []
    ) {
        parent::__construct($context, $defaultPath, $data);
        $this->isThemeActive = $isThemeActive;
    }

    /**
     * Render block HTML
     *
     * @return string
     */
    protected function _toHtml()
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::_toHtml();
        }

        if (false != $this->getTemplate()) {
            return parent::_toHtml();
        }

        if ($this->isCurrent()) {
            $html = '<li>';
            $html .= '<strong>'
                . $this->escapeHtml(__($this->getLabel()))
                . '</strong>';
            $html .= '</li>';
        } else {
            $html = '<li><a x-element-transition-trigger href="' . $this->escapeHtml($this->getHref()) . '"';
            $html .= $this->getTitle()
                ? ' title="' . $this->escapeHtml(__($this->getTitle())) . '"'
                : '';
            $html .= $this->getAttributesHtml() . '>';

            if ($this->getIsHighlighted()) {
                $html .= '<strong>';
            }

            $html .= $this->escapeHtml(__($this->getLabel()));

            if ($this->getIsHighlighted()) {
                $html .= '</strong>';
            }

            $html .= '</a></li>';
        }

        return $html;
    }

    /**
     * Generate attributes' HTML code
     *
     * @return string
     */
    private function getAttributesHtml()
    {
        $attributesHtml = '';
        $attributes = $this->getAttributes();
        if ($attributes) {
            foreach ($attributes as $attribute => $value) {
                $attributesHtml .= ' ' . $attribute . '="' . $this->escapeHtml($value) . '"';
            }
        }

        return $attributesHtml;
    }
}
