import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import Icon from "./Icon";

const MAIN_TABS = ["/", "/usage", "/charge", "/notifications", "/log"];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const showNav = MAIN_TABS.includes(location.pathname);

  return (
    <div className="app-shell">
      <div className="app-header">
        <div className="brand">
          <div className="brand-logo-box">
            <img src="/logo-icon.png" alt="كهرباء باي" className="brand-logo" />
          </div>
          كهرباء باي
        </div>
        <button className="avatar" type="button" aria-label="فتح الحساب" onClick={() => navigate("/profile")}>
          <Icon name="user" />
        </button>
      </div>
      <div className="content">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
