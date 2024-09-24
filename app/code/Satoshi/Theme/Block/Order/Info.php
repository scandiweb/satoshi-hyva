<?php
namespace Satoshi\Theme\Block\Order;

use Magento\Sales\Model\Order\Address;
use Magento\Sales\Block\Order\Info as MagentoInfo;

class Info extends MagentoInfo
{
    /**
     * Returns string with formatted address
     *
     * @param Address $address
     * @return null|string
     */
    public function getFormattedAddress(Address $address): ?string
    {
        $formattedAddress = $this->addressRenderer->format($address, 'html');

        $addressLines = preg_split('/<br\s*\/?>/', $formattedAddress);

        $formattedAddressWithDivs = '';
        foreach ($addressLines as $line) {
            $formattedAddressWithDivs .= '<div class="mb-1">' . $line . '</div>';
        }

        return $formattedAddressWithDivs;
    }
}
