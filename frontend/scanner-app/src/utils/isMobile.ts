export function isMobile() {
  if (typeof window === 'undefined') return false;
  return (
    /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 900)
  );
} 