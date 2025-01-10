<?php

namespace Satoshi\ConfigurableProduct\Model\Product\Type;

use Magento\Catalog\Api\Data\ProductInterfaceFactory;
use Magento\Catalog\Api\ProductAttributeRepositoryInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Model\Cooduct\Gallery\ReadHandler as GalleryReadHandler;
use Magento\ConfigurableProduct\Model\Product\Type\Collection\SalableProcessor;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\File\UploaderFactory;
use Magento\ConfigurableProduct\Model\Product\Type\Configurable as SourceConfigurable;

class Configurable extends SourceConfigurable
{
    /**
     * @var \Magento\Customer\Model\Session
     */
    private $customerSession;

    /**
     * @codingStandardsIgnoreStart/End
     * @param \Magento\Catalog\Model\Product\Option $catalogProductOption
     * @param \Magento\Eav\Model\Config $eavConfig
     * @param \Magento\Catalog\Model\Product\Type $catalogProductType
     * @param \Magento\Framework\Event\ManagerInterface $eventManager
     * @param \Magento\MediaStorage\Helper\File\Storage\Database $fileStorageDb
     * @param \Magento\Framework\Filesystem $filesystem
     * @param \Magento\Framework\Registry $coreRegistry
     * @param \Psr\Log\LoggerInterface $logger
     * @param ProductRepositoryInterface $productRepository
     * @param \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\ConfigurableFactory $typeConfigurableFactory
     * @param \Magento\Catalog\Model\ResourceModel\Eav\AttributeFactory $eavAttributeFactory
     * @param \Magento\ConfigurableProduct\Model\Product\Type\Configurable\AttributeFactory $configurableAttributeFactory
     * @param \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable\Product\CollectionFactory $productCollectionFactory
     * @param \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable\Attribute\CollectionFactory $attributeCollectionFactory
     * @param \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable $catalogProductTypeConfigurable
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Framework\Api\ExtensionAttribute\JoinProcessorInterface $extensionAttributesJoinProcessor
     * @param \Magento\Framework\Cache\FrontendInterface|null $cache
     * @param \Magento\Customer\Model\Session|null $customerSession
     * @param \Magento\Framework\Serialize\Serializer\Json|null $serializer
     * @param ProductInterfaceFactory|null $productFactory
     * @param SalableProcessor|null $salableProcessor
     * @param ProductAttributeRepositoryInterface|null $productAttributeRepository
     * @param SearchCriteriaBuilder|null $searchCriteriaBuilder
     * @param UploaderFactory|null $uploaderFactory
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        \Magento\Catalog\Model\Product\Option $catalogProductOption,
        \Magento\Eav\Model\Config $eavConfig,
        \Magento\Catalog\Model\Product\Type $catalogProductType,
        \Magento\Framework\Event\ManagerInterface $eventManager,
        \Magento\MediaStorage\Helper\File\Storage\Database $fileStorageDb,
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Framework\Registry $coreRegistry,
        \Psr\Log\LoggerInterface $logger,
        ProductRepositoryInterface $productRepository,
        \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\ConfigurableFactory $typeConfigurableFactory,
        \Magento\Catalog\Model\ResourceModel\Eav\AttributeFactory $eavAttributeFactory,
        \Magento\ConfigurableProduct\Model\Product\Type\Configurable\AttributeFactory $configurableAttributeFactory,
        \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable\Product\CollectionFactory $productCollectionFactory,
        \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable\Attribute\CollectionFactory $attributeCollectionFactory,
        \Magento\ConfigurableProduct\Model\ResourceModel\Product\Type\Configurable $catalogProductTypeConfigurable,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Api\ExtensionAttribute\JoinProcessorInterface $extensionAttributesJoinProcessor,
        \Magento\Framework\Cache\FrontendInterface $cache = null,
        \Magento\Customer\Model\Session $customerSession = null,
        \Magento\Framework\Serialize\Serializer\Json $serializer = null,
        ProductInterfaceFactory $productFactory = null,
        SalableProcessor $salableProcessor = null,
        ProductAttributeRepositoryInterface $productAttributeRepository = null,
        SearchCriteriaBuilder $searchCriteriaBuilder = null,
        UploaderFactory $uploaderFactory = null
    ) {
        $this->customerSession = $customerSession;

        parent::__construct(
            $catalogProductOption,
            $eavConfig,
            $catalogProductType,
            $eventManager,
            $fileStorageDb,
            $filesystem,
            $coreRegistry,
            $logger,
            $productRepository,
            $typeConfigurableFactory,
            $eavAttributeFactory,
            $configurableAttributeFactory,
            $productCollectionFactory,
            $attributeCollectionFactory,
            $catalogProductTypeConfigurable,
            $scopeConfig,
            $extensionAttributesJoinProcessor,
            $cache,
            $customerSession,
            $serializer,
            $productFactory,
            $salableProcessor,
            $productAttributeRepository,
            $searchCriteriaBuilder,
            $uploaderFactory
        );
    }

    /**
     * @deprecated 100.1.1
     * @return \Magento\Customer\Model\Session
     */
    private function getCustomerSession()
    {
        if (null === $this->customerSession) {
            $this->customerSession = ObjectManager::getInstance()->get(\Magento\Customer\Model\Session::class);
        }
        return $this->customerSession;
    }

    /**
     * Prepare product and its configuration to be added to some products list.
     * Perform standard preparation process and then add Configurable specific options.
     *
     * @param \Magento\Framework\DataObject $buyRequest
     * @param \Magento\Catalog\Model\Product $product
     * @param string $processMode
     * @return \Magento\Framework\Phrase|array|string
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     */
    protected function _prepareProduct(\Magento\Framework\DataObject $buyRequest, $product, $processMode)
    {
        $attributes = $buyRequest->getSuperAttribute();
        if ($attributes || !$this->_isStrictProcessMode($processMode)) {
            if (!$this->_isStrictProcessMode($processMode)) {
                if (is_array($attributes)) {
                    foreach ($attributes as $key => $val) {
                        if (empty($val)) {
                            unset($attributes[$key]);
                        }
                    }
                } else {
                    $attributes = [];
                }
            }

            $result = parent::_prepareProduct($buyRequest, $product, $processMode);
            if (is_array($result)) {
                //TODO: MAGETWO-23739 get id from _POST and retrieve product from repository immediately.

                /**
                 * $attributes = array($attributeId=>$attributeValue)
                 */
                $subProduct = true;
                if ($this->_isStrictProcessMode($processMode)) {
                    foreach ($this->getConfigurableAttributes($product) as $attributeItem) {
                        /* @var $attributeItem \Magento\Framework\DataObject */
                        $attrId = $attributeItem->getData('attribute_id');
                        if (!isset($attributes[$attrId]) || empty($attributes[$attrId])) {
                            $subProduct = null;
                            break;
                        }
                    }
                }
                if ($subProduct) {
                    $subProduct = $this->getProductByAttributes($attributes, $product);
                }

                if ($subProduct) {
                    $subProductLinkFieldId = $subProduct->getId();
                    $product->addCustomOption('attributes', $this->serializer->serialize($attributes));
                    $product->addCustomOption('product_qty_' . $subProductLinkFieldId, 1, $subProduct);
                    $product->addCustomOption('simple_product', $subProductLinkFieldId, $subProduct);

                    $_result = $subProduct->getTypeInstance()->processConfiguration(
                        $buyRequest,
                        $subProduct,
                        $processMode
                    );
                    if (is_string($_result) && !is_array($_result)) {
                        return $_result;
                    }

                    if (!isset($_result[0])) {
                        return __('You can\'t add the item to shopping cart.')->render();
                    }

                    /**
                     * Adding parent product custom options to child product
                     * to be sure that it will be unique as its parent
                     */
                    if ($optionIds = $product->getCustomOption('option_ids')) {
                        $optionIds = explode(',', $optionIds->getValue() ?? '');
                        foreach ($optionIds as $optionId) {
                            if ($option = $product->getCustomOption('option_' . $optionId)) {
                                $_result[0]->addCustomOption('option_' . $optionId, $option->getValue());
                            }
                        }
                    }

                    $productLinkFieldId = $product->getId();
                    $_result[0]->setParentProductId($productLinkFieldId)
                        ->addCustomOption('parent_product_id', $productLinkFieldId);
                    if ($this->_isStrictProcessMode($processMode)) {
                        $_result[0]->setCartQty(1);
                    }
                    $result[] = $_result[0];
                    return $result;
                } else {
                    if (!$this->_isStrictProcessMode($processMode)) {
                        return $result;
                    }
                }
            } elseif (is_string($result)) {
                return __($result)->render();
            }
        }

        $this->getCustomerSession()->setErrorMessage($this->getSpecifyOptionMessage());
        return $this->getSpecifyOptionMessage()->render();
    }
}
