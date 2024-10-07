import nProgress from "nprogress";

nProgress.configure({ showSpinner: false });

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

type ReviewListType = {
  customerToken: string | false;
  currentPage: number;
  pageSize: number;
  totalPagesObject: any;
  pageInfo: PageInfo | null | any;
  reviews: Review[] | any;
  isLoading: boolean;
  errors: string[];

  onPrivateContentLoaded(data: any): void;
  setCurrentPage(page: any): void;
  getCustomerReviewsQuery(): string;
  getReviewsList(append?: boolean): void;
  initErrorMessages(errors: any): void;
};

export const ReviewList = (props: {
  baseUrl: string;
  productUrlSuffix: string;
  storeCode: string;
  customerReviewsQuery: string;
}) =>
  <ReviewListType>{
    customerToken: false,
    currentPage: 1,
    pageSize: 5,
    totalPagesObject: {},
    pageInfo: {},
    isLoading: true,
    reviews: {},
    errors: [],

    onPrivateContentLoaded(data) {
      this.customerToken = data.customer["signin_token"];
      if (this.customerToken) {
        this.getReviewsList();
      } else {
        this.isLoading = false;
        nProgress.done();
      }
    },

    setCurrentPage(page) {
      this.currentPage = page;
      this.getReviewsList(true);
    },
    getCustomerReviewsQuery() {
      return props.customerReviewsQuery
        .replace("%currentPage%", this.currentPage.toString())
        .replace("%pageSize%", this.pageSize.toString());
    },
    getReviewsList(append = false) {
      this.isLoading = true;
      nProgress.start();
      return fetch(`${BASE_URL}graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Store: props.storeCode,
        },
        credentials: "include",
        body: JSON.stringify({
          query: this.getCustomerReviewsQuery(),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.errors) {
            this.initErrorMessages(data.errors);
          } else {
            const newReviews =
              (data &&
                data.data &&
                data.data.customer &&
                data.data.customer.reviews &&
                data.data.customer.reviews.items) ||
              [];

            this.reviews = append
              ? this.reviews.concat(newReviews)
              : newReviews;

            this.pageInfo =
              (data &&
                data.data &&
                data.data.customer &&
                data.data.customer.reviews &&
                data.data.customer.reviews.page_info) ||
              [];
            this.totalPagesObject =
              (this.pageInfo &&
                this.pageInfo.total_pages &&
                Array.from(
                  { length: this.pageInfo.total_pages },
                  (_v, i) => i + 1,
                )) ||
              [];
          }
          this.isLoading = false;
          nProgress.done();
        });
    },
    initErrorMessages(errors) {
      this.errors = errors.map((error: any) => error.message);
    },
  };
