<?php

declare(strict_types=1);

namespace Satoshi\Theme\Plugin\TemplateEngine;

use Magento\Framework\View\Element\BlockInterface;
use Magento\Framework\View\TemplateEngine\Php;
use Satoshi\Theme\Block\Popup;
use Satoshi\Theme\Block\Resizable;

class ComponentsPlugin
{
  /**
   * @param Php $subject
   * @param BlockInterface $block
   * @param $filename
   * @param mixed[] $dictionary
   * @return mixed[]
   *
   * Assign template variables that are available in all templates.
   */
  public function beforeRender(Php $subject, BlockInterface $block, $filename, array $dictionary = [])
  {
    $dictionary['resizable'] = $block->getLayout()->createBlock(Resizable::class);
    $dictionary['popup'] = $block->getLayout()->createBlock(Popup::class);

    return [$block, $filename, $dictionary];
  }
}
