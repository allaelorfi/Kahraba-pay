import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../api";

function onlyDigits(value) {
  return value.replace(/[^0-9٠-٩۰-۹]/g, "");
}

export default function Auth() {
  const navigate = useNavigate();
  const { setToken, setUser, setOnboardingDone } = useApp();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function localValidate() {
    if (mode === "signup" && !name.trim()) return "يرجى إدخال الاسم الكامل.";
    if (!phone.trim()) return "يرجى إدخال رقم الهاتف.";
    if (!/^09[0-9٠-٩۰-۹]{8}$/.test(phone)) return "رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 09.";
    if (!password) return "يرجى إدخال كلمة المرور.";
    if (password.length < 6) return "كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.";
    return "";
  }

  async function handleNext() {
    setError("");
    const validationError = localValidate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await api.login(phone, password)
        : await api.signup(name, phone, password);
      setToken(result.token);
      setUser(result.user);

      if (mode === "login") {
        setOnboardingDone(true);
        navigate("/");
      } else {
        setOnboardingDone(false);
        navigate("/onboarding/service");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout
  step={1}
  onNext={handleNext}
  nextLabel={loading ? "جارٍ التحقق..." : mode === "login" ? "تسجيل" : "متابعة"}
  nextDisabled={loading}
  backTo="/onboarding"
>
      <div className="eyebrow">مرحبًا بك</div>
      <div className="h1">تسجيل الدخول أو إنشاء حساب</div>
      <div className="sub">أدخل بياناتك للمتابعة إلى التطبيق.</div>

      <div className="tabbar" role="tablist" aria-label="نوع الحساب">
        <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>
          تسجيل الدخول
        </button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>
          حساب جديد
        </button>
      </div>

      {mode === "signup" && (
        <div className="input-group">
          <label htmlFor="name">الاسم الكامل</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: محمد أحمد"
            autoComplete="name"
          />
        </div>
      )}
      <div className="input-group">
        <label htmlFor="phone">رقم الهاتف</label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(onlyDigits(e.target.value).slice(0, 10))}
          placeholder="09xxxxxxxx"
          inputMode="numeric"
          pattern="09[0-9]{8}"
          maxLength={10}
          autoComplete="tel"
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">كلمة المرور</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6 أحرف أو أرقام على الأقل"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {error && <div className="error-box" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    </OnboardingLayout>
  );
}
