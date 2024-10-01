<?php

namespace Satoshi\Theme\Block\Account;

use Magento\Customer\Model\Url;
use Magento\Customer\Model\Session;
use Magento\Framework\View\Element\Template;

/**
 * Customer forgot password block
 */
class ForgotPassword extends Template
{
    /**
     * @var Url
     */
    protected $customerUrl;

    /**
     * @var Session
     */
    protected $customerSession;

    /**
     * @param Template\Context $context
     * @param Url $customerUrl
     * @param Session $customerSession
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        Url $customerUrl,
        Session $customerSession,
        array $data = []
    ) {
        $this->customerUrl = $customerUrl;
        $this->customerSession = $customerSession;
        parent::__construct($context, $data);
    }

    /**
     * Get login URL
     *
     * @return string
     */
    public function getLoginUrl(): string
    {
        return $this->customerUrl->getLoginUrl();
    }

    /**
     * Get error message from session
     *
     * @return string|null
     */
    public function getErrorMessage(): ?string
    {
        $errorMessage = $this->customerSession->getErrorMessage();
        $this->customerSession->unsErrorMessage(); // Clear error message after retrieving it
        return $errorMessage;
    }

    /**
     * Get success message from session
     *
     * @return string|null
     */
    public function getSuccessMessage(): ?string
    {
        $successMessage = $this->customerSession->getSuccessMessage();
        $this->customerSession->unsSuccessMessage(); // Clear success message after retrieving it
        return $successMessage;
    }
}
