import React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }) {
  return <div className={cn("tf-surface", className)} {...props} />;
}

