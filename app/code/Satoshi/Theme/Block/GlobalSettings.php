<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class GlobalSettings extends Template
{
    /**
     * @var array
     */
    private array $settings;

    /**
     * Constructor
     *
     * @param Context $context
     */
    public function __construct(Context $context)
    {
        parent::__construct($context);

        // Load the settings from the file
        $this->settings = $this->loadSettings();
    }

    /**
     * Load settings from the file
     *
     * @return array
     */
    private function loadSettings(): array
    {
        $filePath = BP . '/app/etc/global-settings.php';

        if (!file_exists($filePath)) {
            return [];
        }

        return include $filePath;
    }

    /**
     * Get all settings
     *
     * @return array
     */
    public function getAllSettings(): array
    {
        return $this->settings;
    }

    /**
     * Get a specific setting by key
     *
     * @param string $key
     * @return mixed|null
     */
    public function getSetting(string $key): mixed
    {
        return $this->settings[$key] ?? null;
    }
}
