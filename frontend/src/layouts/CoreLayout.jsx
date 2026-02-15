import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ScrollToTop from "../components/ScrollToTop";

export default function CoreLayout() {
  return (
    <div className="min-h-screen bg-[color:var(--tf-bg)] flex flex-col">
      <ScrollToTop />
      <Header />
      <main id="main" className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

