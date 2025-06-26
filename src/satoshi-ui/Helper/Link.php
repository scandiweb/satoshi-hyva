<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Helper;

use Magento\Framework\App\Helper\AbstractHelper;

class Link extends AbstractHelper
{
    const LINK_TEMPLATE = 'Magento_PageBuilder::widget/link_href.phtml';

    const TYPE_CLASS_MAP = [
        'category' => [
            'type' => \Magento\Catalog\Block\Category\Widget\Link::class,
            'id_path' => "category/:href",
        ],
        'product' => [
            'type' => \Magento\Catalog\Block\Product\Widget\Link::class,
            'id_path' => "product/:href",
        ],
        'page' => [
            'type' => \Magento\Cms\Block\Widget\Page\Link::class,
            'id_path' => ":href",
        ]
    ];

    public function getLinkData($link)
    {
        $linkType = $link['type'];
        $linkTypeDataStructure = self::TYPE_CLASS_MAP[$linkType];
        $linkIdPath = str_replace(':href', $link[$linkType], $linkTypeDataStructure['id_path']);
        $linkData = [
            'class' => $linkTypeDataStructure['type'],
            'id_path' => $linkIdPath
        ];

        return $linkData;
    }

    public function getLinkHref($block, $link)
    {
        if (!isset($link['type'])) {
            return "";
        }

        $linkType = $link['type'];

        if ($linkType === 'default') {
            return $link[$linkType];
        }

        $linkData = $this->getLinkData($link);
        $linkHrefBlock = $block->getLayout()->createBlock($linkData['class'])
            ->setTemplate('Magento_PageBuilder::widget/link_href.phtml');

        if ($linkType === 'page') {
            $linkHrefBlock->setData(
                [
                    'page_id' => $linkData['id_path']
                ]
            );
        } else {
            $linkHrefBlock->setData(
                [
                    'id_path' => $linkData['id_path']
                ]
            );
        }

        $linkHrefHTML = $linkHrefBlock->toHtml();

        return $linkHrefHTML;
    }

    public function getLinkTarget($link) {
        $linkTarget = $link['setting'] ? '_blank' : '';

        return $linkTarget;
    }
}
