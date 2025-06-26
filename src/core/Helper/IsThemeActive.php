<?php

declare(strict_types=1);

namespace Satoshi\Core\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Theme\Model\ResourceModel\Theme\Collection as ThemeCollection;
use Magento\Framework\View\Design\Theme\ThemeProviderInterface;
use Magento\Framework\App\State;
use Magento\Framework\App\Area;
use Magento\Framework\View\DesignInterface;

class IsThemeActive extends AbstractHelper
{
    /**
     * @var StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var ThemeProviderInterface
     */
    private $themeProvider;

    /**
     * @var State
     */
    private $appState;

    /**
     * @var DesignInterface
     */
    private $design;

    /**
     * @var array
     */
    private $themeCache = [];

    /**
     * @param Context $context
     * @param StoreManagerInterface $storeManager
     * @param ThemeProviderInterface $themeProvider
     * @param State $appState
     * @param DesignInterface $design
     */
    public function __construct(
        Context $context,
        StoreManagerInterface $storeManager,
        ThemeProviderInterface $themeProvider,
        State $appState,
        DesignInterface $design
    ) {
        parent::__construct($context);
        $this->storeManager = $storeManager;
        $this->themeProvider = $themeProvider;
        $this->appState = $appState;
        $this->design = $design;
    }

    /**
     * Check if Satoshi theme is active for current store
     *
     * @param int|null $storeId
     * @return bool
     */
    public function isSatoshiTheme(?int $storeId = null): bool
    {
        try {
            // Only check frontend area
            if ($this->appState->getAreaCode() !== Area::AREA_FRONTEND) {
                return false;
            }

            if ($storeId === null) {
                $storeId = $this->storeManager->getStore()->getId();
            }

            // Use cache to avoid repeated lookups within the same request
            $cacheKey = 'satoshi_theme_' . $storeId;
            if (isset($this->themeCache[$cacheKey])) {
                return $this->themeCache[$cacheKey];
            }

            // Get the current design theme
            $currentTheme = $this->design->getDesignTheme();

            // Check if the current theme is Satoshi/Hyva or inherits from it
            $isSatoshi = $this->isThemeSatoshi($currentTheme);

            // Cache the result for this request
            $this->themeCache[$cacheKey] = $isSatoshi;

            return $isSatoshi;
        } catch (\Exception $e) {
            // If we can't determine the theme, err on the side of caution and return false
            $this->_logger->error('Error checking if Satoshi theme is active: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if a theme is Satoshi or inherits from Satoshi
     *
     * @param \Magento\Framework\View\Design\ThemeInterface $theme
     * @return bool
     */
    private function isThemeSatoshi($theme): bool
    {
        if (!$theme) {
            return false;
        }

        // Check if this is directly the Satoshi theme
        if ($theme->getCode() === 'Satoshi/Hyva') {
            return true;
        }

        // Check if this theme inherits from Satoshi (check parent themes)
        $parentTheme = $theme->getParentTheme();
        while ($parentTheme) {
            if ($parentTheme->getCode() === 'Satoshi/Hyva') {
                return true;
            }
            $parentTheme = $parentTheme->getParentTheme();
        }

        return false;
    }
}
