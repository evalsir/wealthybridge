import React from "react";
import SignUpForm from "../components/pages/SignUpForm";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

const SignUpPage = () => {
  return (
    <>
      <Navbar />
      <SignUpForm />
      <Footer/>
    </>
  );
};

export default SignUpPage;
