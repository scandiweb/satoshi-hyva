
export type FetchType = {
    fetchPage: (queryString: string) => void
    _fetchPage: (queryString: string, isReset?: boolean) => void;
}
export const Fetch = () => <FetchType>{
    fetchPage(queryString) {
        this._fetchPage(queryString);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}
