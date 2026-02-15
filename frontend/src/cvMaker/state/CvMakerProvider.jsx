import React from "react";
import { cvMakerReducer, INITIAL_STATE } from "./cvMakerState";
import { CvMakerContext } from "./cvMakerContext";

export function CvMakerProvider({ children }) {
  const [state, dispatch] = React.useReducer(cvMakerReducer, INITIAL_STATE);

  React.useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_TOAST" }), 3500);
    return () => clearTimeout(t);
  }, [state.toast]);

  const value = React.useMemo(() => ({ state, dispatch }), [state]);

  return <CvMakerContext.Provider value={value}>{children}</CvMakerContext.Provider>;
}

