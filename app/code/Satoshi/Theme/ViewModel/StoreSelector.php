<?php
declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Magento\Framework\Escaper;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Locale\ResolverInterface;

/**
 * ViewModel for Store Selector.
 *
 * This ViewModel provides functionality to fetch available stores
 * and their respective store information for the store selector component.
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
     * @var Escaper
     */
    protected Escaper $escaper;

    /**
     * StoreSelector constructor.
     *
     * @param StoreManagerInterface $storeManager
     * @param ResolverInterface $localeResolver
     * @param Escaper $escaper
     */
    public function __construct(
        StoreManagerInterface $storeManager,
        ResolverInterface $localeResolver,
        Escaper $escaper,
    ) {
        $this->storeManager = $storeManager;
        $this->localeResolver = $localeResolver;
        $this->escaper = $escaper;
    }

    /**
     * Retrieve available stores and their details.
     *
     * This method returns an array where each entry corresponds to a store
     * with its code, name, locale, and URL.
     *
     * @return array<string, array{name: string, locale: string, url: string}>
     */
    public function getAvailableStores(): array
    {
        $stores = $this->storeManager->getStores();
        $defaultStoreCode = $this->getDefaultStoreCode();
        $storesInfo = [];

        foreach ($stores as $store) {
            $scopeLocale = $this->localeResolver->getLocale($store->getId());
            $url = $store->getBaseUrl();
            $storeCode = $store->getCode();

            if ($storeCode !== $defaultStoreCode) {
                $url .= '?___store=' . $this->escaper->escapeJs($storeCode);
            }

            $storesInfo[$storeCode] = [
                'name' => $store->getName(),
                'locale' => $scopeLocale,
                'url' => $url
            ];
        }
        return $storesInfo;
    }

    /**
     * Retrieve the current store code.
     *
     * This method returns the store code of the current store.
     *
     * @return string
     * @throws NoSuchEntityException If the store is not found.
     */
    public function getCurrentStoreCode(): string
    {
        return $this->storeManager->getStore()->getCode();
    }

    /**
     * Get the default store code.
     *
     * This method returns the store code of the default store view.
     *
     * @return string
     */
    public function getDefaultStoreCode(): string
    {
        $defaultStore = $this->storeManager->getDefaultStoreView();
        return $defaultStore->getCode();
    }
}
