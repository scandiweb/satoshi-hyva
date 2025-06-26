<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Hyva\Theme\ViewModel\Currency as BaseCurrency;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Locale\Bundle\CurrencyBundle;

class Currency extends BaseCurrency
{
    /**
     * Retrieve currencies array
     * Return array: code => [name, symbol]
     * Return empty array if only one currency
     *
     * Extended to return symbol with name & code
     *
     * @return array
     * @throws NoSuchEntityException
     */
    public function getCurrencies(): array
    {
        if (!$this->currencies) {
            $currencies = [];
            $codes = $this->storeManager->getStore()->getAvailableCurrencyCodes(true);
            if (is_array($codes) && count($codes) > 1) {
                $rates = $this->currencyModel->getCurrencyRates(
                    $this->storeManager->getStore()->getBaseCurrency()->getCode(),
                    $codes
                );

                foreach ($codes as $code) {
                    if (isset($rates[$code])) {
                        $allCurrencies = (new CurrencyBundle())->get(
                            $this->localeResolver->getLocale()
                        )['Currencies'];
                        $currencies[$code] = [
                            'name' => $allCurrencies[$code][1] ?: $code,
                            'symbol' => $allCurrencies[$code][0] ?? '',
                        ];
                    }
                }
            }

            $this->currencies = $currencies;
        }
        return $this->currencies;
    }
}