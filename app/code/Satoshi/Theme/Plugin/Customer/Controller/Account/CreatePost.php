<?php

namespace Satoshi\Theme\Plugin\Customer\Controller\Account;

/**
 * Custom Changes:
 * 1. Override the checkPasswordConfirmation method
 */

use Magento\Customer\Controller\Account\CreatePost as OriginalCreatePost;

class CreatePost extends OriginalCreatePost
{
    /**
     * Do nothing; password confirmation is deleted.
     *
     * @param string $password
     * @param string $confirmation
     * @return void
     */
    public function checkPasswordConfirmation(
        $password,
        $confirmation
    ): void
    {
        //
    }
}
