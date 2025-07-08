<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Helper;

use Magento\Framework\App\Helper\AbstractHelper;

class Decode extends AbstractHelper
{
    public function decodeJSONHTMLEntity($string)
    {
        $result = json_decode(str_replace("&amp;quote;", "\"", $string ?? ''), true);

        return $result;
    }
}
