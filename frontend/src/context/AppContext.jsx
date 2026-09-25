import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("kp_token"));
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem("kp_onboarded") === "1"
  );
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("kp_theme") || "dark");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem("kp_token", token);
    else localStorage.removeItem("kp_token");
  }, [token]);

  useEffect(() => {
    localStorage.setItem("kp_onboarded", onboardingDone ? "1" : "0");
  }, [onboardingDone]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kp_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setActiveAccountId(null);
      setAccountsLoaded(false);
      return;
    }
    let mounted = true;
    Promise.all([api.getUser(), api.getAccounts()])
      .then(([nextUser, accounts]) => {
        if (!mounted) return;
        setUser(nextUser);
        if (accounts.length) {
          const active = accounts.find((a) => a.active) || accounts[0];
          setActiveAccountId(active.id);
        }
      })
      .catch(() => {
        if (!mounted) return;
        localStorage.removeItem("kp_token");
        localStorage.removeItem("kp_onboarded");
        setToken(null);
        setOnboardingDone(false);
      })
      .finally(() => mounted && setAccountsLoaded(true));
    return () => {
      mounted = false;
    };
  }, [token]);

  const value = {
    token,
    setToken,
    onboardingDone,
    setOnboardingDone,
    activeAccountId,
    setActiveAccountId,
    accountsLoaded,
    user,
    setUser,
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    logout: () => {
      localStorage.removeItem("kp_token");
      localStorage.removeItem("kp_onboarded");
      setToken(null);
      setOnboardingDone(false);
      setUser(null);
      setActiveAccountId(null);
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
