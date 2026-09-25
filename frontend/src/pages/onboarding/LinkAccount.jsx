import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";
import { api } from "../../api";

function onlyDigits(value) {
  return value.replace(/[^0-9٠-٩۰-۹]/g, "");
}

export default function LinkAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const service = location.state?.service || "prepaid";

  const [meterNumber, setMeterNumber] = useState("");
  const [region, setRegion] = useState("طرابلس — المنطقة الوسطى");
  const [category, setCategory] = useState("منزلي");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isInvoice = service === "invoice";

  async function handleNext() {
    setError("");
    if (!meterNumber.trim()) {
      setError(isInvoice ? "يرجى إدخال رقم نقطة الخدمة." : "يرجى إدخال رقم العداد.");
      return;
    }
    if (!/^\d{4,20}$/.test(meterNumber.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))) ) {
      setError("رقم العداد أو نقطة الخدمة يجب أن يحتوي على أرقام فقط.");
      return;
    }

    setLoading(true);
    try {
      await api.linkAccount({ serviceType: service, meterNumber, region, category });
      navigate("/onboarding/alerts");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingLayout
      step={3}
      onNext={handleNext}
      nextLabel={loading ? "جارٍ ربط الحساب..." : "ربط الحساب"}
      nextDisabled={loading}
      backTo="/onboarding/service"
    >
      <div className="eyebrow">ربط الحساب</div>
      <div className="h1">{isInvoice ? "ربط رقم نقطة الخدمة" : "ربط عداد الشحن المسبق"}</div>
      <div className="sub">يُستخدم هذا الرقم لعرض بيانات الحساب والاستهلاك.</div>

      <div className="gecol-box">
        <div className="ic"><i className="fa-solid fa-building" /></div>
        <div className="t">
          <b>الشركة العامة للكهرباء — GECOL</b>
          أدخل الرقم المسجل في بيانات الخدمة.
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="meterNumber">{isInvoice ? "رقم نقطة الخدمة" : "رقم العداد"}</label>
        <input
          id="meterNumber"
          value={meterNumber}
          onChange={(e) => setMeterNumber(onlyDigits(e.target.value).slice(0, 20))}
          placeholder="مثال: 205841"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={20}
        />
      </div>
      <div className="input-group">
        <label htmlFor="region">المنطقة / فرع الشركة</label>
        <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option>طرابلس — المنطقة الوسطى</option>
          <option>بنغازي — المنطقة الشرقية</option>
          <option>مصراتة</option>
          <option>سبها — المنطقة الجنوبية</option>
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="category">فئة الاشتراك</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>منزلي</option>
          <option>تجاري</option>
          <option>زراعي</option>
          <option>صناعي</option>
        </select>
      </div>
      {error && <div className="error-box" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
    </OnboardingLayout>
  );
}
