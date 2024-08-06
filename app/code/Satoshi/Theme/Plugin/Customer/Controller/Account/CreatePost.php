<?php

namespace Satoshi\Theme\Plugin\Customer\Controller\Account;

use Magento\Customer\Controller\Account\CreatePost as OriginalCreatePost;

class CreatePost extends OriginalCreatePost
{
    /**
     * Override the checkPasswordConfirmation method.
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
        // Do nothing; password confirmation is deleted.
    }
}
