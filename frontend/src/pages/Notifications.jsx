import { useEffect, useState } from "react";
import { api } from "../api";
import Icon from "../components/Icon";

const ICON_STYLES = {
  low: { bg: "var(--amber-soft)", color: "var(--amber)", icon: "arrow-down" },
  soon: { bg: "var(--red-soft)", color: "var(--red)", icon: "hourglass-half" },
  usage: { bg: "var(--blue-soft)", color: "var(--blue)", icon: "chart-line" },
  success: { bg: "var(--green-soft)", color: "var(--green)", icon: "circle-check" }
};

export default function Notifications() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getNotifications().then((d) => {
      setData(d.list);
      setSettings(d.settings);
    }).catch((err) => setError(err.message));
  }, []);

  async function toggle(key) {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      await api.saveNotificationSettings(next);
    } catch (err) {
      setSettings(settings);
      setError(err.message);
    }
  }

  if (!data || !settings) return <div className="center-loading">{error || "جارٍ تحميل البيانات..."}</div>;

  return (
    <>
      <div className="eyebrow">التنبيهات</div>
      <div className="h1">المعلومات في الوقت المناسب</div>
      <div className="sub">تظهر التنبيهات عندما تكون مفيدة لمتابعة حسابك.</div>

      {data.length === 0 && <div className="note-box">لا توجد تنبيهات حاليًا.</div>}
      {data.map((n) => {
        const style = ICON_STYLES[n.icon] || ICON_STYLES.usage;
        return (
          <div className="notif-row" key={n.id}>
            <div className="ic" style={{ background: style.bg, color: style.color }}><Icon name={style.icon} /></div>
            <div className="txt">
              <b>{n.title}</b><p>{n.body}</p><small>{n.when}</small>
            </div>
          </div>
        );
      })}

      <div className="section-title">إعدادات التنبيهات</div>
      {[
        ["lowBalance", "قرب نفاد الرصيد", "أقل من 3 أيام متبقية"],
        ["invoiceDue", "موعد الفاتورة", "قبل 3 أيام من الاستحقاق"],
        ["usageSpike", "ارتفاع الاستهلاك", "مقارنة بمعدلك المعتاد"],
        ["weeklySummary", "ملخص أسبوعي", "ملخص دوري عن الحساب"]
      ].map(([key, title, hint]) => (
        <div className="toggle-row" key={key}>
          <div className="k">{title}<small>{hint}</small></div>
          <button type="button" className={"switch" + (settings[key] ? " on" : "")} onClick={() => toggle(key)} aria-pressed={settings[key]} aria-label={title} />
        </div>
      ))}
      {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
    </>
  );
}
