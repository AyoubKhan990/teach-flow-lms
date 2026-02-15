import React from "react";
import { ToastContext } from "./ToastContext";

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

