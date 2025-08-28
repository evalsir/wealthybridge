
import React from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { Outlet } from "react-router-dom";
import ScrollToTopButton from "../components/ScrollTop/ScrollToTopButton";

const Layout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTopButton />
    </>
  );
};

export default Layout;