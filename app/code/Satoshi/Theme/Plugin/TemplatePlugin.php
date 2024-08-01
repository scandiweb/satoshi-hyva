<?php

namespace Satoshi\Theme\Plugin;

use Magento\Framework\Message\Session;
use Magento\Framework\View\Element\Template;

class TemplatePlugin
{

    /**
     * @var Session
     */
    private Session $session;

    /**
     * @param  Session  $session
     */
    public function __construct(Session $session)
    {
        $this->session = $session;
    }


    /**
     * Dynamically call a non-existent method
     *
     * @param  Template  $subject
     * @param  callable  $proceed
     * @param  string  $name
     * @param  array  $arguments
     * @return mixed
     */
    public function around__call(Template $subject, callable $proceed, $name, $arguments)
    {
        if ($name === 'getFormMessage') {
            return $this->getFormMessage($subject, $proceed, ...$arguments);
        }

        return $proceed($name, $arguments);
    }

    /**
     * @param  Template  $subject
     * @param  callable  $proceed
     * @param ...$args
     * @return string[]
     */
    public function getFormMessage(Template $subject, callable $proceed, ...$args)
    {
        if ($this->session->hasFormMessage()) {
            $message = $this->session->getFormMessage();
            $this->session->unsFormMessage();
            return $message;
        }
        return [];
    }
}
