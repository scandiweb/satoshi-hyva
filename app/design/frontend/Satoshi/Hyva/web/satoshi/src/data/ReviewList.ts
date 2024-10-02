import nProgress from "nprogress";

nProgress.configure({showSpinner: false});

type Review = {
    product: {
        image: {
            url: string;
            label: string;
        };
        name: string;
        url_key: string;
    };
    created_at: string;
    ratings_breakdown: { value: number }[];
    summary: string;
    text: string;
};

type PageInfo = {
    page_size: number;
    total_pages: number;
    current_page: number;
};

type AlpineReviewList = {
    customerToken: string | false;
    currentPage: number;
    pageSize: number;
    totalPagesObject: number[];
    pageInfo: PageInfo | null;
    reviews: Review[];

    getCustomerReviewsQuery(): string;

    setCurrentPage(page: number): void;

    getReviewsList(): void;

    onPrivateContentLoaded(data: any): void;

    initErrorMessages(errors: any): void;
};

export const ReviewList = (props: {
    baseUrl: string;
    productUrlSuffix: string;
    storeCode: string;
    customerReviewsQuery: string;
}) => <AlpineReviewList>{
    customerToken: false,
    currentPage: 1,
    pageSize: 5,
    totalPagesObject: [],
    pageInfo: null,
    reviews: [],
    errors: [],
    getCustomerReviewsQuery() {
        return props.customerReviewsQuery
            .replace('%currentPage%', this.currentPage.toString())
            .replace('%pageSize%', this.pageSize.toString());
    },
    setCurrentPage(page: number) {
        this.currentPage = page;
        this.getReviewsList();
    },
    getReviewsList() {
        nProgress.start();
        return fetch(`${props.baseUrl}graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Store: props.storeCode
            },
            credentials: 'include',
            body: JSON.stringify({
                query: this.getCustomerReviewsQuery()
            })
        })
            .then((response) => response.json())
            .then((data) => {
                if (data && data.errors) {
                    this.initErrorMessages(data.errors);
                } else {
                    this.reviews = data?.data?.customer?.reviews?.items || [];
                    this.pageInfo = data?.data?.customer?.reviews?.page_info || {};
                    this.totalPagesObject = Array.from({length: this.pageInfo?.total_pages || 0}, (_, i) => i + 1);
                }
                nProgress.done();
            });
    },
    onPrivateContentLoaded(data: any) {
        this.customerToken = data.customer?.signin_token || false;
        if (this.customerToken) {
            this.getReviewsList();
        } else {
            nProgress.done();
        }
    },
    initErrorMessages(errors: any) {
        this.errors = errors.map((error: { message: string }) => error.message);
    },
}
