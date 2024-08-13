<?php

namespace Satoshi\Theme\ViewModel;

use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Locale\ResolverInterface;

class LanguageSelector implements ArgumentInterface
{
    protected StoreManagerInterface $storeManager;
    protected ResolverInterface $localeResolver;

    public function __construct(
        StoreManagerInterface $storeManager,
        ResolverInterface $localeResolver
    ) {
        $this->storeManager = $storeManager;
        $this->localeResolver = $localeResolver;
    }

    public function getAvailableLanguages(): array
    {
        $stores = $this->storeManager->getStores();
        $languages = [];
        foreach ($stores as $store) {
            $scopeLocale = $this->localeResolver->getLocale($store->getId());

            $languages[$store->getCode()] = [
                'name' => $store->getName(),
                'locale' => $scopeLocale,
                'url' => $store->getBaseUrl()
            ];
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
