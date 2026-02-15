import React from "react";
import { CvMakerContext } from "./cvMakerContext";

export function useCvMaker() {
  const ctx = React.useContext(CvMakerContext);
  if (!ctx) throw new Error("useCvMaker must be used inside CvMakerProvider");
  return ctx;
}

