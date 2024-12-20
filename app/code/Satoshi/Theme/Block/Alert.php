<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block;

use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\View\Element\Template;

/**
 * Controller for displaying global alert messages.
 *
 */
class Alert extends Template
{
    /**
     * @var CheckoutSession
     */
    protected CheckoutSession $_checkoutSession;

    /**
     * @param Context $context
     * @param CheckoutSession $session
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        CheckoutSession $session,
        array $data = []
    ) {
        $this->_checkoutSession = $session;
        parent::__construct($context, $data);
    }

    /**
     * Alert flash message.
     *
     * @return array
     */
    public function getAlertMessage(): array
    {
        $message = $this->_checkoutSession->getAlertMessage() ?? [];
        $this->_checkoutSession->unsAlertMessage();
        return $message;
    }
}
