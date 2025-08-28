// src/components/CustomButton.jsx
import React from "react";
import { Link } from "react-router-dom";

const CustomButton = ({
  to = "#",
  children = "Click Me",
  className = "",
  onClick,
  type = "button",
}) => {
  const baseStyles =
    "bg-blue-950 hover:bg-blue-700 text-white font-semibold py-1 px-3 cursor-pointer rounded-full transition duration-200";

  return to ? (
    <Link to={to}>
      <button
        type={type}
        onClick={onClick}
        className={`${baseStyles} ${className}`}
      >
        {children}
      </button>
    </Link>
  ) : (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export default CustomButton;
