<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Locale\ResolverInterface;

/**
 * ViewModel for Language Selector.
 *
 * This ViewModel provides functionality to fetch available languages
 * and their respective store information for the language selector component.
 */
class StoreSelector implements ArgumentInterface
{
    /**
     * @var StoreManagerInterface
     */
    protected StoreManagerInterface $storeManager;

    /**
     * @var ResolverInterface
     */
    protected ResolverInterface $localeResolver;

    /**
     * StoreSelector constructor.
     *
     * @param StoreManagerInterface $storeManager
     * @param ResolverInterface $localeResolver
     */
    public function __construct(
        StoreManagerInterface $storeManager,
        ResolverInterface $localeResolver
    ) {
        $this->storeManager = $storeManager;
        $this->localeResolver = $localeResolver;
    }

    /**
     * Retrieve available stores and their details.
     *
     * This method returns an array where each entry corresponds to a store
     * with its code, name, locale, and base URL.
     *
     * @return array<string, array{name: string, locale: string, url: string}>
     */
    public function getAvailableStores(): array
    {
        $stores = $this->storeManager->getStores();
        $storesInfo = [];
        foreach ($stores as $store) {
            $scopeLocale = $this->localeResolver->getLocale($store->getId());

            $storesInfo[$store->getCode()] = [
                'name' => $store->getName(),
                'locale' => $scopeLocale,
                'url' => $store->getBaseUrl()
            ];
        }
        return $storesInfo;
    }

    /**
     * Retrieve the current language code.
     *
     * This method returns the store code of the current store.
     *
     * @return string
     * @throws NoSuchEntityException If the store is not found.
     */
    public function getCurrentLanguageCode(): string
    {
        return $this->storeManager->getStore()->getCode();
    }

    /**
     * Get the default language code.
     *
     * This method returns the store code of the default store view.
     *
     * @return string
     */
    public function getDefaultLanguageCode(): string
    {
        $defaultStore = $this->storeManager->getDefaultStoreView();
        return $defaultStore->getCode();
    }
}
