<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block\Html\Header;

use Hyva\Theme\ViewModel\Logo\LogoPathResolver;
use Magento\Theme\Block\Html\Header\Logo as SourceLogo;
use Magento\MediaStorage\Helper\File\Storage\Database as FileStorageHelper;
use Magento\Framework\View\Element\Template\Context as TemplateContext;

class Logo extends SourceLogo
{
  /**
   * @param TemplateContext $context
   * @param FileStorageHelper $fileStorageHelper
   * @param array $data
   */
  public function __construct(
    TemplateContext $context,
    FileStorageHelper $fileStorageHelper,
    array $data = []
  ) {
    // Call the parent constructor to ensure proper dependency injection
    parent::__construct($context, $fileStorageHelper, $data);
  }

  /**
   * @return string
   */
  public function getLogoSrc()
  {
    /** @var LogoPathResolver $logoPathResolver */
    $logoPathResolver = $this->getData('logoPathResolver');
    if ($logoPathResolver && method_exists($logoPathResolver, 'getLogoSrc')){
      return $logoPathResolver->getLogoSrc($this->getData('logo_file'));
    }
    else{
      if (empty($this->_data['logo_src'])) {
        $this->_data['logo_src'] = $this->_getLogoUrl();
      }
      return $this->_data['logo_src'];
    }
  }

  /**
   * @return int
   */
  public function getOriginalLogoWidth()
  {
    $logoSrc = $this->getLogoSrc();
    if ($logoSrc) {
      $imageInfo = getimagesize($logoSrc);
      if ($imageInfo && isset($imageInfo[0])) {
        return (int)$imageInfo[0];
      }
    }
    return 0;
  }

  /**
   * @return int
   */
  public function getOriginalLogoHeight()
  {
    $logoSrc = $this->getLogoSrc();
    if ($logoSrc) {
      $imageInfo = getimagesize($logoSrc);
      if ($imageInfo && isset($imageInfo[1])) {
        return (int)$imageInfo[1];
      }
    }
    return 0;
  }
}
