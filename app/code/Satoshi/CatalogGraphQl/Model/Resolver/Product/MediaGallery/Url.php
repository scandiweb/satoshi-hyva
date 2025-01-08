<?php

declare(strict_types=1);

namespace Satoshi\CatalogGraphQl\Model\Resolver\Product\MediaGallery;

use Exception;
use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\ImageFactory;
use Magento\CatalogGraphQl\Model\Resolver\Product\MediaGallery\Url as SourceUrl;
use Magento\CatalogGraphQl\Model\Resolver\Products\DataProvider\Image\Placeholder as PlaceholderProvider;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

/**
 * Returns media url
 *
 * overridden to set same image as in PDP. (to eliminate blinking on navigation)
 */
class Url extends SourceUrl
{
    /**
     * @var ImageFactory
     */
    private $productImageFactory;

    /**
     * @var PlaceholderProvider
     */
    private $placeholderProvider;

    /**
     * @param ImageFactory $productImageFactory
     * @param PlaceholderProvider $placeholderProvider
     */
    public function __construct(
        ImageFactory        $productImageFactory,
        PlaceholderProvider $placeholderProvider
    )
    {
        parent::__construct($productImageFactory, $placeholderProvider);
        $this->productImageFactory = $productImageFactory;
        $this->placeholderProvider = $placeholderProvider;
    }

    /**
     * @inheritdoc
     */
    public function resolve(
        Field       $field,
                    $context,
        ResolveInfo $info,
        array       $value = null,
        array       $args = null
    )
    {
        if (!isset($value['image_type']) && !isset($value['file'])) {
            throw new LocalizedException(__('"image_type" value should be specified'));
        }

        if (!isset($value['model'])) {
            throw new LocalizedException(__('"model" value should be specified'));
        }

        /** @var Product $product */
        $product = $value['model'];
        if (isset($value['image_type'])) {
            $imagePath = $product->getData($value['image_type']);
            return $this->getImageUrl($value['image_type'], $imagePath);
        } elseif (isset($value['file'])) {
            return $this->getImageUrl('image', $value['file']);
        }
        return [];
    }

    /**
     * Get image URL
     *
     * @param string $imageType
     * @param string|null $imagePath
     * @return string
     * @throws Exception
     */
    private function getImageUrl(string $imageType, ?string $imagePath): string
    {
        if (empty($imagePath) && !empty($this->placeholderCache[$imageType])) {
            return $this->placeholderCache[$imageType];
        }
        $image = $this->productImageFactory->create();
        $image
            ->setWidth(700)
            ->setHeight(700)
            ->setDestinationSubdir($imageType)
            ->setBaseFile($imagePath);

        if ($image->isBaseFilePlaceholder()) {
            $this->placeholderCache[$imageType] = $this->placeholderProvider->getPlaceholder($imageType);
            return $this->placeholderCache[$imageType];
        }

        return $image->getUrl();
    }
}
