import React from "react";
import { Outlet } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import "./assignmentWriter.css";

export default function AssignmentWriterLayout() {
  return (
    <div className="assignment-writer min-h-screen">
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </div>
  );
}

