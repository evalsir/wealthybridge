import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const dummyRef = useRef(null);

  useEffect(() => {
    // Create a hidden dummy element at top of the page
    const scrollToTop = () => {
      if (dummyRef.current) {
        dummyRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    scrollToTop();
  }, [pathname]);

  return <div ref={dummyRef} className="h-0 w-0 absolute top-0 left-0" />;
};

export default ScrollToTop;
