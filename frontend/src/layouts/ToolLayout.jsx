import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header/Header";
import ScrollToTop from "../components/ScrollToTop";

export default function ToolLayout() {
  return (
    <div className="min-h-screen bg-[color:var(--tf-bg)]">
      <ScrollToTop />
      <Header />
      <main id="main" className="tf-page">
        <Outlet />
      </main>
    </div>
  );
}

