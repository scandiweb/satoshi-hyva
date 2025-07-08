<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Block\Customer;

use Magento\Wishlist\Block\Customer\Wishlist as SourceWishlist;

class Wishlist extends SourceWishlist
{
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;

    /**
     * @param \Magento\Catalog\Block\Product\Context $context
     * @param \Magento\Framework\App\Http\Context $httpContext
     * @param \Magento\Catalog\Helper\Product\ConfigurationPool $helperPool
     * @param \Magento\Customer\Helper\Session\CurrentCustomer $currentCustomer
     * @param \Magento\Framework\Data\Helper\PostHelper $postDataHelper
     * @param \Magento\Customer\Model\Session $customerSession
     * @param array $data
     */
    public function __construct(
        \Magento\Catalog\Block\Product\Context $context,
        \Magento\Framework\App\Http\Context $httpContext,
        \Magento\Catalog\Helper\Product\ConfigurationPool $helperPool,
        \Magento\Customer\Helper\Session\CurrentCustomer $currentCustomer,
        \Magento\Framework\Data\Helper\PostHelper $postDataHelper,
        \Magento\Customer\Model\Session $customerSession,
        array $data = [],
    ) {
        $this->_customerSession = $customerSession;

        parent::__construct(
            $context,
            $httpContext,
            $helperPool,
            $currentCustomer,
            $postDataHelper,
            $data,
        );
    }

    /**
     * Retrieve and clear the success message from the session
     *
     * @return string|null
     */
    public function getSuccessMessage()
    {
        $successMessage = $this->_customerSession->getSuccessMessage();
        $this->_customerSession->unsSuccessMessage();
        return $successMessage;
    }

    /**
     * Retrieve and clear the error message from the session
     *
     * @return string|null
     */
    public function getErrorMessage()
    {
        $errorMessage = $this->_customerSession->getErrorMessage();
        $this->_customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
