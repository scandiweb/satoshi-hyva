export function Wishlist(updateParams, productSku) {
    return {
        currentWishListItem: {},
        init() {
            setTimeout(() => {
                this.currentWishListItem = this.$store.wishlist.wishlistItems.find(
                    item => item.product_sku === productSku
                );
            }, 0);

            this.$watch("selectedAttributes", () => {
                const wishlistItems = this.$store.wishlist.wishlistItems;
                const selectedAttributes = this.selectedAttributes;
                this.currentWishListItem =
                    wishlistItems.find(item => {
                        const matchingOptions = item.options.filter(option =>
                            selectedAttributes.some(attr => {
                                    if (option.option_id) {
                                        return option.option_id === attr.attributeId && option.option_value === attr.value
                                    } else if (option.label) {
                                        return option.label === attr.label && option.option_value === attr.value
                                    }
                                }
                            )
                        );
                        return (
                            matchingOptions.length === selectedAttributes.length &&
                            matchingOptions.length === item.options.length
                        );
                    }) || {};
            });


        },
        addToWishlist(productId) {
            const postParams = updateParams ||
                {
                    action: BASE_URL + "wishlist/index/add/",
                    data:
                        {
                            product: productId,
                            uenc:
                                hyva.getUenc()
                        }
                }

            postParams.data['form_key'] = hyva.getFormKey();
            postParams.data['qty'] = document.getElementById(`qty[${productId}]`)
                ? document.getElementById(`qty[${productId}]`).value || 1
                : 1;

            let postData = Object.keys(postParams.data).map(key => {
                return `${key}=${postParams.data[key]}`;
            }).join('&');

            // take the all the input fields that configure this product
            // includes custom, configurable, grouped and bundled options
            Array.from(document.querySelectorAll(
                '[name^=options], [name^=super_attribute], [name^=bundle_option], [name^=super_group], [name^=links]')
            ).map(input => {
                if (input.type === "select-multiple") {
                    Array.from(input.selectedOptions).forEach(option => {
                        postData += `&${input.name}=${option.value}`
                    })
                } else {
                    // skip "checkable inputs" that are not checked
                    if (!(['radio', 'checkbox', 'select'].includes(input.type) && !input.checked)) {
                        postData += `&${input.name}=${input.value}`
                    }
                }
            });
            fetch(postParams.action, {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body": postData,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then((response) => {
                if (response.redirected && response.url.includes('/customer/account/login')) {
                    window.location.href = response.url;
                } else if (response.ok) {
                    return response.json();
                } else {
                    typeof window.dispatchMessages !== "undefined" && window.dispatchMessages(
                        [{
                            type: "warning",
                            text: "<?= $escaper->escapeHtml(__('Could not add item to wishlist.')) ?>"
                        }], 5000
                    );
                }
            }).then((response) => {
                if (!response) {
                    return;
                }
                this.currentWishListItem = response.item;
                this.$store.wishlist.setWishlistItems([response.item, ...this.$store.wishlist.wishlistItems]);
                this.$store.wishlist.showWishlist();
            }).catch((error) => {
                typeof window.dispatchMessages !== "undefined" && window.dispatchMessages(
                    [{
                        type: "error",
                        text: error
                    }], 5000
                );
            });
        },
        removeFromWishlist() {
            const itemId = this.currentWishListItem['item_id'];

            fetch(`${BASE_URL}/wishlist/index/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    item: itemId,
                    form_key: hyva.getFormKey(),
                    uenc: hyva.getUenc(),
                }),
                mode: "cors",
                credentials: "include",
            })
                .then(response => {
                    if (response.ok) {
                        const updatedWishlistItems = this.$store.wishlist.wishlistItems.filter(item => item.item_id !== this.currentWishListItem.item_id);
                        this.$store.wishlist.setWishlistItems(updatedWishlistItems);
                        this.$store.wishlist.showWishlist();
                        this.currentWishListItem = {};
                        console.log('Item removed from wishlist');
                    } else {
                        return response.text().then(text => {
                            throw new Error(text);
                        });
                    }
                })
                .catch(error => {
                    console.log('Error removing item from wishlist:', error);
                });

        }
    }
}
