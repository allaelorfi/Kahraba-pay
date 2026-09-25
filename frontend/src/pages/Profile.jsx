import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubHeader from "../components/SubHeader";
import Icon from "../components/Icon";
import { api } from "../api";
import { useApp } from "../context/AppContext";

export default function Profile() {
  const navigate = useNavigate();
  const { logout, theme, toggleTheme, user: contextUser } = useApp();
  const [user, setUser] = useState(contextUser);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getUser().then(setUser).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <SubHeader title="حسابي" backTo="/" />
      <div className="profile-hero">
        <div className="profile-avatar"><Icon name="user" /></div>
        <b>{user?.name || "..."}</b>
        <span>{user?.phone || "..."} · فئة {user?.category || "منزلي"}</span>
      </div>

      <button className="menu-row menu-button" onClick={() => navigate("/profile/accounts")}>
        <span className="ic" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}><Icon name="house" /></span>
        <b>العدادات والحسابات</b><span className="chev">‹</span>
      </button>
      <button className="menu-row menu-button" onClick={() => navigate("/profile/invoice")}>
        <span className="ic" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}><Icon name="file-invoice" /></span>
        <b>الفاتورة الشهرية</b><span className="chev">‹</span>
      </button>
      <button className="menu-row menu-button" onClick={() => navigate("/profile/support")}>
        <span className="ic" style={{ background: "var(--green-soft)", color: "var(--green)" }}><Icon name="life-ring" /></span>
        <b>الدعم والمساعدة</b><span className="chev">‹</span>
      </button>
      <button className="menu-row menu-button" onClick={() => setShowSettings((v) => !v)}>
        <span className="ic" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}><Icon name="gear" /></span>
        <b>الإعدادات العامة</b><span className="chev">{showSettings ? "⌃" : "‹"}</span>
      </button>

      {showSettings && (
        <div className="settings-card">
          <div className="settings-title">مظهر التطبيق</div>
          <div className="toggle-row">
            <div className="k">
              الوضع {theme === "dark" ? "الليلي" : "النهاري"}
              <small>التبديل بين المظهرين وحفظ اختيارك على هذا الجهاز</small>
            </div>
            <button className={"switch" + (theme === "light" ? " on" : "")} onClick={toggleTheme} aria-label="تبديل الوضع" aria-pressed={theme === "light"}>
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}

      <button
        className="menu-row menu-button danger"
        onClick={() => {
          logout();
          navigate("/onboarding");
        }}
      >
        <span className="ic" style={{ background: "var(--red-soft)", color: "var(--red)" }}><Icon name="right-from-bracket" /></span>
        <b>تسجيل الخروج</b>
      </button>
    </>
  );
}
