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
        $messages = $this->_customerSession->getFieldMessages();
        $this->_customerSession->unsFieldMessages();
        return is_array($messages) ? $messages : [];
    }

    /**
     * Set field-specific messages into customer session.
     *
     * This method allows storing an array of field-specific messages into the customer session,
     * which can later be retrieved and used to display error or success messages for form fields.
     *
     * @param array $messages An associative array of field messages, where each key represents
     *                        a form field (e.g., 'email', 'password') and the value is an array
     *                        containing:
     *                        - 'status' => (string) The status of the message (e.g., 'error', 'success')
     *                        - 'message' => (string) The actual message to be displayed for the field
     *
     * @return void
     */
    public function setFieldMessages(array $messages): void
    {
        $this->_customerSession->setFieldMessages($messages);
    }
}
