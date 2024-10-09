import type {Magics} from "alpinejs";

export type ProductListStoreType = {
    isFiltersSidebarExpanded: boolean;

    toggleFiltersSidebar(): void;
} & Magics<{}>;

export const ProductListStore = <ProductListStoreType>{
    isFiltersSidebarExpanded: true,

    toggleFiltersSidebar() {
        this.isFiltersSidebarExpanded = !this.isFiltersSidebarExpanded;
        let element = document.querySelector('.plp-main-content');
        if (!element) {
            element = document.querySelector('.search-main-content');
        }
        if (this.isFiltersSidebarExpanded) {
            element.className = element.className.replace('md:w-full', 'md:w-plp-main');
        } else {
            if (element) {
                element.className = element.className.replace('md:w-plp-main', 'md:w-full');
            }
        }
    },
};
