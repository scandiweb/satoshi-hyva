<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Cms\Model\Template\FilterProvider;
use Magento\Cms\Model\PageFactory;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\View\Page\Config;
use Magento\Cms\Model\Page as CmsPageModel;

class CustomCmsPage extends Template
{
    protected $_filterProvider;
    protected $_pageFactory;
    protected $_storeManager;
    protected $pageConfig;
    protected $_scopeConfig;
    protected $_page;

    public function __construct(
        Context $context,
        FilterProvider $filterProvider,
        StoreManagerInterface $storeManager,
        PageFactory $pageFactory,
        Config $pageConfig,
        CmsPageModel $page,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->_filterProvider = $filterProvider;
        $this->_storeManager = $storeManager;
        $this->_pageFactory = $pageFactory;
        $this->pageConfig = $pageConfig;
        $this->_scopeConfig = $context->getScopeConfig();
        $this->_page = $page;
    }

    public function getPageId()
    {
        return $this->getRequest()->getParam('page_id', 'home');
    }

    public function getPage()
    {
        if (!$this->hasData('page')) {
            $pageId = $this->getPageId();
            $page = $this->_pageFactory->create();
            $page->setStoreId($this->_storeManager->getStore()->getId())->load($pageId);
            $this->setData('page', $page);
        }

        return $this->getData('page');
    }

    public function getPageTitle()
    {
        return $this->getPage()->getTitle();
    }

    public function getPageContent()
    {
        $page = $this->getPage();
        $content = $page->getContent();

        // Debugging information
        echo '<pre>';
        echo 'Page ID: ' . $page->getId() . PHP_EOL;
        echo 'Page Title: ' . $page->getTitle() . PHP_EOL;
        echo 'Page Content: ' . $content . PHP_EOL;
        echo '</pre>';
        die();

        return $this->_filterProvider->getPageFilter()->filter($content);
    }

    protected function _prepareLayout()
    {
        $page = $this->getPage();
        $this->_addBreadcrumbs($page);
        $this->pageConfig->addBodyClass('cms-' . $page->getIdentifier());
        $metaTitle = $page->getMetaTitle();
        $this->pageConfig->getTitle()->set($metaTitle ? $metaTitle : $page->getTitle());
        $this->pageConfig->setKeywords($page->getMetaKeywords());
        $this->pageConfig->setDescription($page->getMetaDescription());

        $pageMainTitle = $this->getLayout()->getBlock('page.main.title');
        if ($pageMainTitle) {
            $cmsTitle = $page->getContentHeading() ?: ' ';
            $pageMainTitle->setPageTitle($this->escapeHtml($cmsTitle));
        }
        return parent::_prepareLayout();
    }

    protected function _addBreadcrumbs(CmsPageModel $page)
    {
        $homePageIdentifier = $this->_scopeConfig->getValue('web/default/cms_home_page', \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
        $homePageDelimiterPosition = $homePageIdentifier === null ? false : strrpos($homePageIdentifier, '|');
        if ($homePageDelimiterPosition) {
            $homePageIdentifier = substr($homePageIdentifier, 0, $homePageDelimiterPosition);
        }
        $noRouteIdentifier = $this->_scopeConfig->getValue('web/default/cms_no_route', \Magento\Store\Model\ScopeInterface::SCOPE_STORE);
        $noRouteDelimiterPosition = $noRouteIdentifier === null ? false : strrpos($noRouteIdentifier, '|');
        if ($noRouteDelimiterPosition) {
            $noRouteIdentifier = substr($noRouteIdentifier, 0, $noRouteDelimiterPosition);
        }
        if ($this->_scopeConfig->getValue('web/default/show_cms_breadcrumbs', \Magento\Store\Model\ScopeInterface::SCOPE_STORE)
            && ($breadcrumbsBlock = $this->getLayout()->getBlock('breadcrumbs'))
            && $page->getIdentifier() !== $homePageIdentifier
            && $page->getIdentifier() !== $noRouteIdentifier
        ) {
            $breadcrumbsBlock->addCrumb(
                'home',
                [
                    'label' => __('Home'),
                    'title' => __('Go to Home Page'),
                    'link' => $this->_storeManager->getStore()->getBaseUrl()
                ]
            );
            $breadcrumbsBlock->addCrumb('cms_page', ['label' => $page->getTitle(), 'title' => $page->getTitle()]);
        }
    }
}
