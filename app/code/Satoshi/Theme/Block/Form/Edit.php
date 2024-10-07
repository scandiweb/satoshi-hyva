<?php

namespace Satoshi\Theme\Block\Form;

use Magento\Customer\Block\Form\Edit as SourceEdit;

class Edit extends SourceEdit
{
    /**
     * Retrieve and clear the error messages from the session
     *
     * @return string|null
     */
    public function getErrorMessage(): ?string
    {
        $errorMessage = $this->customerSession->getErrorMessage();
        $this->customerSession->unsErrorMessage();
        return $errorMessage;
    }

    /**
     * Retrieve and clear the success message from the session
     *
     * @return string|null
     */
    public function getSuccessMessage(): ?string
    {
        $successMessage = $this->customerSession->getSuccessMessage();
        $this->customerSession->unsSuccessMessage();
        return $successMessage;
    }
}
