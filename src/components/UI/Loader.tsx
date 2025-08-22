import React from "react";
import "./Loader.scss";

const Loader = () => {
  return (
    <div className="loader">
      <div className="loader__bar loader__bar--1"></div>
      <div className="loader__bar loader__bar--2"></div>
      <div className="loader__bar loader__bar--3"></div>
      <div className="loader__bar loader__bar--4"></div>
      <div className="loader__bar loader__bar--5"></div>
    </div>
  );
};

export default Loader;
