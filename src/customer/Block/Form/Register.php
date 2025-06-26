<?php
declare(strict_types=1);

namespace Satoshi\Customer\Block\Form;

use Magento\Customer\Block\Form\Register as SourceRegister;

class Register extends SourceRegister
{
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
