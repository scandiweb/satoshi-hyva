<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

/**
 * Theme Configuration Block
 */
class ThemeConfig extends Template
{
    /**
     * @var ScopeConfigInterface
     */
    private ScopeConfigInterface $scopeConfig;

    /**
     * Constructor
     *
     * @param Context $context
     * @param ScopeConfigInterface $scopeConfig
     * @param array $data
     */
    public function __construct(
        Context              $context,
        ScopeConfigInterface $scopeConfig,
        array                $data = []
    )
    {
        parent::__construct($context, $data);
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * Get a configuration value by full path
     *
     * @param string $path
     * @return mixed
     */
    public function getConfig(string $path): mixed
    {
        return $this->scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE);
    }

    /**
     * Get a theme-specific configuration value by key
     *
     * @param string $key
     * @return mixed
     */
    public function getThemeConfig(string $key): mixed
    {
        $path = 'satoshi_theme/theme_config/' . $key;
        return $this->getConfig($path);
    }
}
