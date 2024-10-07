<?php

namespace Satoshi\Theme\Block\Widget\Guest;

use Magento\Framework\View\Element\Template\Context;
use Magento\Sales\Block\Widget\Guest\Form as SourceForm;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Http\Context as HttpContext;

/** @var Form $block */


/**
 * @api
 * @since 100.0.2
 */
class Form extends SourceForm
{
    /**
     * @var Session
     */
    private Session $customerSession;

    public function __construct(
        Context $context,
        HttpContext $httpContext,
        Session $customerSession,
        array $data = [],
    ) {
        parent::__construct($context, $httpContext, $data);
        $this->customerSession = $customerSession;
    }

    /**
     * Retrieve and clear the success message from the session
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
