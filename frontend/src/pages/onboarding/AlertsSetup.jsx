import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";
import { useApp } from "../../context/AppContext";
import { api } from "../../api";

export default function AlertsSetup() {
  const navigate = useNavigate();
  const { setOnboardingDone } = useApp();
  const [prefs, setPrefs] = useState({
    lowBalance: true,
    invoiceDue: true,
    usageSpike: true,
    weeklySummary: false
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleFinish() {
    setError("");
    setLoading(true);
    try {
      await api.saveNotificationPrefs(prefs);
      setOnboardingDone(true);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout
      step={4}
      onNext={handleFinish}
      nextLabel={loading ? "جارٍ الحفظ..." : "الدخول إلى التطبيق"}
      nextDisabled={loading}
      backTo="/onboarding/link"
    >
      <div className="eyebrow">التنبيهات</div>
      <div className="h1">تخصيص التنبيهات</div>
      <div className="sub">اختر التنبيهات التي ترغب في تلقيها، ويمكنك تعديلها لاحقًا من الإعدادات.</div>

      {[
        ["lowBalance", "تنبيه قرب نفاد الرصيد", "عندما يكفي الرصيد لأقل من 3 أيام"],
        ["invoiceDue", "تنبيه موعد الفاتورة", "قبل 3 أيام من تاريخ الاستحقاق"],
        ["usageSpike", "تنبيه ارتفاع الاستهلاك", "عند ارتفاع الاستهلاك مقارنة بالمعدل المعتاد"],
        ["weeklySummary", "ملخص أسبوعي", "تقرير مختصر عن الحساب كل أسبوع"]
      ].map(([key, title, hint]) => (
        <div className="toggle-row" key={key}>
          <div className="k">
            {title}
            <small>{hint}</small>
          </div>
          <button
            type="button"
            aria-label={title}
            aria-pressed={prefs[key]}
            className={"switch" + (prefs[key] ? " on" : "")}
            onClick={() => toggle(key)}
          />
        </div>
      ))}
      {error && <div className="error-box" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    </OnboardingLayout>
  );
}
