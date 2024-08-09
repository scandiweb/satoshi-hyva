<?php

namespace Satoshi\Theme\ViewModel;

use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Locale\ResolverInterface;
use Magento\Store\Model\App\Emulation;

class LanguageSelector implements ArgumentInterface
{
    protected StoreManagerInterface $storeManager;
    protected ResolverInterface $localeResolver;
    protected Emulation $appEmulation;

    public function __construct(
        StoreManagerInterface $storeManager,
        ResolverInterface $localeResolver,
        Emulation $appEmulation
    ) {
        $this->storeManager = $storeManager;
        $this->localeResolver = $localeResolver;
        $this->appEmulation = $appEmulation;
    }

    public function getAvailableLanguages(): array
    {
        $stores = $this->storeManager->getStores();
        $languages = [];
        foreach ($stores as $store) {
            // Start store emulation
            $this->appEmulation->startEnvironmentEmulation($store->getId());

            // Get the locale for the store
            $localeCode = $this->localeResolver->getLocale();

            // Add store data to the languages array
            $languages[$store->getCode()] = [
                'name' => $store->getName(),
                'locale' => $localeCode,
                'url' => $store->getBaseUrl()
            ];

            // Stop store emulation
            $this->appEmulation->stopEnvironmentEmulation();
        }
        return $languages;
    }

    /**
     * @throws NoSuchEntityException
     */
    public function getCurrentLanguageCode(): string
    {
        return $this->storeManager->getStore()->getCode();
    }
}
