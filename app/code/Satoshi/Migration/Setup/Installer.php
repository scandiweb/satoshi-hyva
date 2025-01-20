<?php


namespace Satoshi\Migration\Setup;

use Magento\CatalogSampleData\Model\Attribute;
use Magento\CatalogSampleData\Model\Category;
use Magento\CatalogSampleData\Model\Product;
use Magento\Framework\Setup;

class Installer implements Setup\SampleData\InstallerInterface
{
    /**
     * Setup class for category
     *
     * @var Category
     */
    protected $categorySetup;

    /**
     * Setup class for product attributes
     *
     * @var Attribute
     */
    protected $attributeSetup;

    /**
     * Setup class for products
     *
     * @var Product
     */
    protected $configurableProduct;

    /**
     * @param Category $categorySetup
     * @param Attribute $attributeSetup
     * @param Product $productSetup
     */
    public function __construct(
        Category $categorySetup,
        Attribute $attributeSetup,
        \Satoshi\Migration\Model\Product $configurableProduct,
    ) {
        $this->categorySetup = $categorySetup;
        $this->attributeSetup = $attributeSetup;
        $this->configurableProduct = $configurableProduct;
    }

    /**
     * {@inheritdoc}
     */
    public function install()
    {
        $this->attributeSetup->install(['Satoshi_Migration::fixtures/cats.csv']);
        // $this->categorySetup->install(['Satoshi_Migration::fixtures/categories.csv']);
        // $this->configurableProduct->install();
    }
}
