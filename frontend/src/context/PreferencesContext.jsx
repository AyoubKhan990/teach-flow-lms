import React, { useCallback, useMemo, useState } from "react";
import { PreferencesContext } from "./PreferencesContext";

const DEFAULTS = {
  theme: "auto",
  language: "en",
};

function safeRead(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (!root) return;
  const t = theme || "auto";
  root.dataset.theme = t;
}

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(() => safeRead("tf_theme") || DEFAULTS.theme);
  const [language, setLanguageState] = useState(
    () => safeRead("tf_language") || DEFAULTS.language
  );

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    const normalized = next === "light" || next === "dark" ? next : "auto";
    setThemeState(normalized);
    safeWrite("tf_theme", normalized);
  }, []);

  const setLanguage = useCallback((next) => {
    const normalized = typeof next === "string" && next.trim() ? next.trim() : DEFAULTS.language;
    setLanguageState(normalized);
    safeWrite("tf_language", normalized);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
    }),
    [language, setLanguage, setTheme, theme]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

