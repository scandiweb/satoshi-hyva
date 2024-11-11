<?php

declare(strict_types=1);

namespace Satoshi\Sales\Block\Widget\Guest;

use Magento\Customer\Model\Session;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\View\Element\Template\Context;
use Magento\Sales\Block\Widget\Guest\Form as SourceForm;

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

    /**
     * Constructor
     *
     * @param Context $context
     * @param HttpContext $httpContext
     * @param Session $customerSession
     * @param array $data
     */
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
    public function getErrorMessage()
    {
        $errorMessage = $this->customerSession->getErrorMessage();
        $this->customerSession->unsErrorMessage();
        return $errorMessage;
    }
}
