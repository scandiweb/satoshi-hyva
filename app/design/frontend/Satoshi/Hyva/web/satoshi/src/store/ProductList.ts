import type {Magics} from "alpinejs";

export type ProductListStoreType = {
    isFiltersSidebarExpanded: boolean;

    toggleFiltersSidebar(): void;
} & Magics<{}>;

export const ProductListStore = <ProductListStoreType>{
    isFiltersSidebarExpanded: true,

    toggleFiltersSidebar() {
        this.isFiltersSidebarExpanded = !this.isFiltersSidebarExpanded;
        const element = document.querySelector('.grid-columns');

        if (this.isFiltersSidebarExpanded) {
            element.className = element.className.replace('md:gap-0', 'md:gap-8');
        } else {
            if (element) {
                element.className = element.className.replace('md:gap-8', 'md:gap-0');
            }
        }
    },
};
