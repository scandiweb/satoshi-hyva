<?php

namespace Satoshi\Contact\Block;

use Magento\Contact\Block\ContactForm as SourceContactForm;
use Magento\Framework\View\Element\Template;
use Magento\Framework\Session\SessionManagerInterface;

class ContactForm extends SourceContactForm
{
    /**
     * @var SessionManagerInterface
     */
    private $session;

    /**
     * @param Template\Context $context
     * @param SessionManagerInterface $session
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        SessionManagerInterface $session,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->session = $session;
    }

    /**
     * Get form submission success message
     *
     * @return string|null
     */
    public function getContactSuccessMessage()
    {
        $message = $this->session->getContactSuccessMessage();
        $this->session->unsContactSuccessMessage();
        return $message;
    }

    /**
     * Get form submission error message
     *
     * @return string|null
     */
    public function getContactErrorMessage()
    {
        $message = $this->session->getContactErrorMessage();
        $this->session->unsContactErrorMessage();
        return $message;
    }

    /**
     * Get name field error message
     *
     * @return string|null
     */
    public function getContactNameErrorMessage()
    {
        $message = $this->session->getContactNameErrorMessage();
        $this->session->unsContactNameErrorMessage();
        return $message;
    }

    /**
     * Get comment field error message
     *
     * @return string|null
     */
    public function getContactCommentErrorMessage()
    {
        $message = $this->session->getContactCommentErrorMessage();
        $this->session->unsContactCommentErrorMessage();
        return $message;
    }

    /**
     * Get email field error message
     *
     * @return string|null
     */
    public function getContactEmailErrorMessage()
    {
        $message = $this->session->getContactEmailErrorMessage();
        $this->session->unsContactEmailErrorMessage();
        return $message;
    }
}
