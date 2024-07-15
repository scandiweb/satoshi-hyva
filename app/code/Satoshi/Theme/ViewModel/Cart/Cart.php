<?php
declare(strict_types=1);

namespace Satoshi\Theme\ViewModel\Cart;

use Magento\Checkout\Model\Session;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Quote\Api\CartTotalRepositoryInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Serialize\Serializer\JsonHexTag;

class Cart implements ArgumentInterface
{
    /**
     * @var Session
     */
    protected $checkoutSession;

    /**
     * @var CartTotalRepositoryInterface
     */
    protected $cartTotalRepository;

    /**
     * @var ScopeConfigInterface
     */
    protected $scopeConfig;

    /**
     * @var JsonHexTag
     */
    protected $jsonHexTagSerializer;

    /**
     * Items constructor.
     * @param Session $checkoutSession
     */
    public function __construct(
        Session $checkoutSession,
        CartTotalRepositoryInterface $cartTotalRepository,
        ScopeConfigInterface $scopeConfig,
        JsonHexTag $jsonHexTagSerializer,
    ) {
        $this->checkoutSession = $checkoutSession;
        $this->cartTotalRepository = $cartTotalRepository;
        $this->scopeConfig = $scopeConfig;
        $this->jsonHexTagSerializer = $jsonHexTagSerializer;
    }

    /**
     * Retrieve cart items quantity
     *
     * @return int
     */
    public function getCartItemsQty() {
        return $this->checkoutSession->getQuote()->getItemsQty();
    }

    /**
     * Retrieve cart totals
     *
     * @return array
     */
    public function getCartTotals(): array
    {
        // TODO: Refactor to return only what we need.
        if (!$this->getCartItemsQty()) {
            return [];
        }

        $totalsSort = $this->scopeConfig->getValue('sales/totals_sort', 'store');

        /** @var \Magento\Quote\Api\Data\TotalsInterface $totals */
        $totals = $this->cartTotalRepository->get($this->checkoutSession->getQuote()->getId());
        $totalSegmentsData = [];
        /** @var \Magento\Quote\Model\Cart\TotalSegment $totalSegment */
        foreach ($totals->getTotalSegments() as $totalSegment) {
            $totalSegmentArray = $totalSegment->toArray();
            if (is_object($totalSegment->getExtensionAttributes())) {
                $totalSegmentArray['extension_attributes'] = $totalSegment->getExtensionAttributes()->__toArray();
            }
            // if (floatval($totalSegmentArray['value']) > 0) {
                $totalSegmentsData[] = $totalSegmentArray;
            // }
        }

        usort($totalSegmentsData, function($a, $b) use ($totalsSort) {
            $valueA = isset($totalsSort[$a['code']]) ? $totalsSort[$a['code']] : 0;
            $valueB = isset($totalsSort[$b['code']]) ? $totalsSort[$b['code']] : 0;
            return $valueA - $valueB;
        });

        $totals->setTotalSegments($totalSegmentsData);
        $totalsArray = $totals->toArray();
        if (is_object($totals->getExtensionAttributes())) {
            $totalsArray['extension_attributes'] = $totals->getExtensionAttributes()->__toArray();
        }
        return $totalsArray;
    }

    /**
     * Get serialized cart totals
     *
     * @return bool|string
     */
    public function getSerializedCartTotals()
    {
        return $this->jsonHexTagSerializer->serialize($this->getCartTotals());
    }

}