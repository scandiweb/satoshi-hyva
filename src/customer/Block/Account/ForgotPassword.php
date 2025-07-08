<?php

namespace Satoshi\Customer\Block\Account;

use Magento\Customer\Model\Session;
use Magento\Customer\Model\Url;
use Magento\Framework\View\Element\Template;
use Magento\Customer\Block\Account\Forgotpassword as SourceForgotPassword;

class ForgotPassword extends SourceForgotPassword
{
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
        $this->customerSession = $customerSession;
        parent::__construct($context, $customerUrl, $data);
    }

    /**
     * Get error message from session
     *
     * @return string|null
     */
    public function getErrorMessage(): ?string
    {
        $errorMessage = $this->customerSession->getErrorMessage();
        $this->customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
