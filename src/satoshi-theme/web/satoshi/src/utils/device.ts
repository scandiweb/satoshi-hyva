export const isMobile = () => {
  return window.matchMedia("(max-width: 767px)").matches;
};
