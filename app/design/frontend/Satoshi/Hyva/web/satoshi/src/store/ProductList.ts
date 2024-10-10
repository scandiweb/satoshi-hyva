import type {Magics} from "alpinejs";

export type ProductListStoreType = {
    isFiltersSidebarExpanded: boolean;

    toggleFiltersSidebar(): void;
} & Magics<{}>;

export const ProductListStore = <ProductListStoreType>{
    isFiltersSidebarExpanded: true,

    toggleFiltersSidebar() {
        this.isFiltersSidebarExpanded = !this.isFiltersSidebarExpanded;
    },
};
