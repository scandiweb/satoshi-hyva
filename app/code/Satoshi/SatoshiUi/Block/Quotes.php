<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block;

use Magento\Framework\View\Element\Template;

class Quotes extends Template
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::satoshi_ui/quotes.phtml';


    /**
     * @return bool|int|null
     */
    protected function getCacheLifetime()
    {
        return parent::getCacheLifetime() ?: 3600;
    }

    /**
     * @return array
     */
    public function getCacheKeyInfo()
    {
        return [
            'SATOSHI_QUOTES',
            uniqid()
        ];
    }
}
