<?php

namespace Satoshi\Customer\Block\Form;

use Magento\Customer\Block\Form\Login as SourceLogin;
use Magento\Customer\Model\Session;
use Magento\Customer\Model\Url;
use Magento\Framework\View\Element\Template\Context;


class Login extends SourceLogin
{
    /**
     * @var Session
     */
    protected $_customerSession;

    /**
     * @param Context $context
     * @param Session $customerSession
     * @param Url $customerUrl
     * @param array $data
     */
    public function __construct(
        Context $context,
        Session $customerSession,
        Url $customerUrl,
        array $data = []
    ) {
        $this->_customerSession = $customerSession;
        parent::__construct($context, $customerSession, $customerUrl, $data);
    }

    /**
     * Retrieve and clear the error messages from the session
     *
     * @return string|null
     */
    public function getErrorMessage(): ?string
    {
        $errorMessage = $this->_customerSession->getErrorMessage();
        $this->_customerSession->unsErrorMessage();
        return $errorMessage;
    }

    /**
     * Retrieve and clear the success message from the session
     *
     * @return string|null
     */
    public function getSuccessMessage(): ?string
    {
        $successMessage = $this->_customerSession->getSuccessMessage();
        $this->_customerSession->unsSuccessMessage();
        return $successMessage;
    }
}
