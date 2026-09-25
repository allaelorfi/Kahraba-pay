import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";

import Splash from "./pages/onboarding/Splash";
import Auth from "./pages/onboarding/Auth";
import ServiceType from "./pages/onboarding/ServiceType";
import LinkAccount from "./pages/onboarding/LinkAccount";
import AlertsSetup from "./pages/onboarding/AlertsSetup";

import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Consumption from "./pages/Consumption";
import Charge from "./pages/Charge";
import Notifications from "./pages/Notifications";
import Log from "./pages/Log";
import Profile from "./pages/Profile";
import Accounts from "./pages/Accounts";
import Invoice from "./pages/Invoice";
import Support from "./pages/Support";

function RequireOnboarded({ children }) {
  const { onboardingDone, token } = useApp();
  if (!token || !onboardingDone) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Splash />} />
      <Route path="/onboarding/auth" element={<Auth />} />
      <Route path="/onboarding/service" element={<ServiceType />} />
      <Route path="/onboarding/link" element={<LinkAccount />} />
      <Route path="/onboarding/alerts" element={<AlertsSetup />} />

      <Route
        path="/"
        element={
          <RequireOnboarded>
            <MainLayout />
          </RequireOnboarded>
        }
      >
        <Route index element={<Home />} />
        <Route path="usage" element={<Consumption />} />
        <Route path="charge" element={<Charge />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="log" element={<Log />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/accounts" element={<Accounts />} />
        <Route path="profile/invoice" element={<Invoice />} />
        <Route path="profile/support" element={<Support />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
