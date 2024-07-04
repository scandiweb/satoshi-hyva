<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class Resizable extends Template
{
  protected $_template = 'Satoshi_Theme::resizable.phtml';

  public function __construct(
    Context $context,
    array $data = []
  ) {
    parent::__construct($context, $data);
  }

  public function setChildTemplate(string $template)
  {
    $this->setChild(
      'resizable-content',
      $this->getLayout()->createBlock(Template::class)->setTemplate($template)
    );
    return $this;
  }
}
