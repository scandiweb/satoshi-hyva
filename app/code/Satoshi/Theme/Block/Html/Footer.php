<?php

namespace Satoshi\Theme\Block\Html;

use Magento\Theme\Block\Html\Footer as SourceFooter;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Cms\Api\BlockRepositoryInterface;

class Footer extends SourceFooter
{
    /**
     * @var BlockRepositoryInterface
     */
    protected $blockRepository;

    /**
     * @param Context $context
     * @param HttpContext $httpContext
     * @param BlockRepositoryInterface $blockRepository
     * @param array $data
     */
    public function __construct(
        Context $context,
        HttpContext $httpContext,
        BlockRepositoryInterface $blockRepository,
        array $data = []
    ) {
        $this->blockRepository = $blockRepository;
        parent::__construct($context, $httpContext, $data);
    }

    /**
     * Get footer CMS block ids
     *
     * @return array
     */
    public function getFooterCmsBlockIds()
    {
        return array('footer-content-1', 'footer-content-2', 'footer-content-3');
    }

    /**
     * Check if the CMS block is available and enabled
     *
     * @param string $id
     *
     * @return bool
     */
    public function getIsCmsBlockAvailable(string $id)
    {
        try {
            $cmsBlock = $this->blockRepository->getById($id);
            return $cmsBlock->isActive();
        } catch (NoSuchEntityException $e) {
            return false;
        }
    }

    /**
     * Get the cms block's title
     *
     * @param string $id
     *
     * @return string|null
     */
    public function getCmsBlockTitle(string $id)
    {
        try {
            $cmsBlock = $this->blockRepository->getById($id);
            return $cmsBlock->getTitle();
        } catch (NoSuchEntityException $e) {
            return null;
        }
    }

    /**
     * Detect if we are on the homepage
     *
     * @return bool
     */
    public function getIsHomePage()
    {
        $fullActionName = $this->getRequest()->getFullActionName();
        return $fullActionName == 'cms_index_index';
    }
}
