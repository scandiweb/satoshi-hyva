<?php
declare(strict_types=1);

namespace Satoshi\Theme\Block\Form;

use Magento\Customer\Block\Form\Register as BaseRegister;

class Register extends BaseRegister
{
    /**
     * Retrieve form field messages from customer session.
     *
     * @return array
     */
    public function getFieldMessages(): array
    {
        $messages = $this->customerSession->getFieldMessages();
        $this->customerSession->unsFieldMessages();
        return is_array($messages) ? $messages : [];
    }
}
