<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\View\Element\Text;

class Popup extends Template
{
  protected $_template = 'Satoshi_Theme::popup.phtml';

  public function __construct(
    Context $context,
    array $data = []
  ) {
    parent::__construct($context, $data);
  }

  public function setChildTemplate(string $childTemplate)
  {
    $this->setChild(
      'popup-content',
      $this->getLayout()->createBlock(Template::class)->setTemplate($childTemplate)
    );
    return $this;
  }

  public function setChildHtml(string $childHtml)
  {
    $this->setChild(
      'popup-content',
      $this->getLayout()->createBlock(Text::class)->setText($childHtml)
    );
    return $this;
  }

  public function render()
  {
    return $this->toHtml();
  }
}