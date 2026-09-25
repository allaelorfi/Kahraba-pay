import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";

export default function ServiceType() {
  const navigate = useNavigate();
  const [service, setService] = useState("prepaid");

  return (
    <OnboardingLayout
      step={2}
      onNext={() => navigate("/onboarding/link", { state: { service } })}
      backTo="/onboarding/auth"
    >
      <div className="eyebrow">نوع الخدمة</div>
      <div className="h1">ما نوع خدمة الكهرباء لديك؟</div>
      <div className="sub">يساعدنا ذلك على عرض البيانات والتنبيهات المناسبة لحسابك.</div>

      <div
        className={"service-card" + (service === "prepaid" ? " selected" : "")}
        onClick={() => setService("prepaid")}
      >
        <div className="check">✓</div>
        <div className="top">
          <div className="ic"><i className="fa-solid fa-bolt" /></div>
          <b>شحن مسبق (عداد)</b>
        </div>
        <p>تشحن رصيدًا ينخفض مع الاستهلاك، مع متابعة الرصيد وتقدير المدة المتبقية.</p>
      </div>

      <div
        className={"service-card" + (service === "invoice" ? " selected" : "")}
        onClick={() => setService("invoice")}
      >
        <div className="check">✓</div>
        <div className="top">
          <div className="ic"><i className="fa-solid fa-file-invoice" /></div>
          <b>فاتورة شهرية</b>
        </div>
        <p>تعرض الفاتورة الشهرية وتفاصيل الاستهلاك وتاريخ الاستحقاق.</p>
      </div>
    </OnboardingLayout>
  );
}
