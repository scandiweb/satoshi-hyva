<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Block\Customer;

use Magento\Wishlist\Block\Customer\Sharing as SourceSharing;

class Sharing extends SourceSharing
{
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;

    /**
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param \Magento\Wishlist\Model\Config $wishlistConfig
     * @param \Magento\Framework\Session\Generic $wishlistSession
     * @param \Magento\Customer\Model\Session $customerSession
     * @param array $data
     */
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        \Magento\Wishlist\Model\Config $wishlistConfig,
        \Magento\Framework\Session\Generic $wishlistSession,
        \Magento\Customer\Model\Session $customerSession,
        array $data = [],
    ) {
        $this->_customerSession = $customerSession;

        parent::__construct(
            $context,
            $wishlistConfig,
            $wishlistSession,
            $data
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
     * @return array|null
     */
    public function getErrorMessage()
    {
        $errorMessage = $this->_customerSession->getErrorMessage();
        $this->_customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
