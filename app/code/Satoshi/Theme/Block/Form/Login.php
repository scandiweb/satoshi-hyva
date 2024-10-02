<?php

namespace Satoshi\Theme\Block\Form;

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

    public function getErrorMessage(): ?string
    {
        $errorMessage = $this->_customerSession->getErrorMessage();
        $this->_customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
