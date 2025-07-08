<?php
declare(strict_types=1);

namespace Satoshi\Customer\Block\Form;

use Magento\Customer\Block\Form\Edit as SourceEdit;

class Edit extends SourceEdit
{
    /**
     * Retrieve and clear the success message from the session
     *
     * @return string|null
     */
    public function getSuccessMessage()
    {
        $successMessage = $this->customerSession->getSuccessMessage();
        $this->customerSession->unsSuccessMessage();
        return $successMessage;
    }

    /**
     * Retrieve and clear the error message from the session
     *
     * @return array|null
     */
    public function getErrorMessage()
    {
        $errorMessage = $this->customerSession->getErrorMessage();
        $this->customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
