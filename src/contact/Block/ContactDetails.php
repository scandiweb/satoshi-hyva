<?php

namespace Satoshi\Contact\Block;

use Magento\Framework\View\Element\Template;
use Hyva\Theme\ViewModel\StoreConfig;
use Magento\Directory\Model\Region;

class ContactDetails extends Template
{
    /**
     * @var StoreConfig
     */
    private $storeConfig;

    /**
     * @var Region
     */
    private $region;

    /**
     * @param Template\Context $context
     * @param StoreConfig $storeConfig
     * @param Region $region
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        StoreConfig $storeConfig,
        Region $region,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->storeConfig = $storeConfig;
        $this->region = $region;
    }

    /**
     * Get store name
     *
     * return string
     */
    public function getStoreName()
    {
        return $this->storeConfig->getStoreConfig('general/store_information/name') ?? '';
    }

    /**
     * Get store phone number
     *
     * return string
     */
    public function getStorePhoneNumber()
    {
        return $this->storeConfig->getStoreConfig('general/store_information/phone') ?? '';
    }

    /**
     * Get store email
     *
     * return string
     */
    public function getStoreEmail()
    {
        return $this->storeConfig->getStoreConfig('trans_email/ident_general/email') ?? '';
    }

    /**
     * Get store address
     *
     * return string
     */
    public function getStoreAddress()
    {
        $regionId = $this->storeConfig->getStoreConfig('general/store_information/region_id') ?? '';
        $regionName = '';
        if ($regionId) {
            $region = $this->region->load($regionId);
            $regionName = $region->getName();
        }
        $postcode = $this->storeConfig->getStoreConfig('general/store_information/postcode') ?? '';
        $city = $this->storeConfig->getStoreConfig('general/store_information/city') ?? '';
        $streetLine1 = $this->storeConfig->getStoreConfig('general/store_information/street_line1') ?? '';
        $addressWithoutStreetLine1 = trim($city . ' ' . $regionName . ' ' . $postcode);

        if (!$streetLine1 && !$addressWithoutStreetLine1){
            return '';
        } elseif ($streetLine1 && $addressWithoutStreetLine1) {
            return $streetLine1 . ', ' . $addressWithoutStreetLine1;
        } else {
            return $streetLine1 . $addressWithoutStreetLine1;
        }
    }

    /**
     * Get store vat number
     *
     * return string
     */
    public function getStoreVatNumber()
    {
        return $this->storeConfig->getStoreConfig('general/store_information/merchant_vat_number') ?? '';
    }
}
