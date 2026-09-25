import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";

export default function Splash() {
  const navigate = useNavigate();
  return (
    <OnboardingLayout step={0} nextLabel="ابدأ" onNext={() => navigate("/onboarding/auth")}>
      <div className="splash-wrap">
        <div className="splash-logo-box">
  <img
    src="/logo-icon.png"
    alt="كهرباء باي"
    className="splash-logo-img"
  />
</div>
        <div className="splash-title">كهرباء باي</div>
        <div className="splash-sub">
          رصيدك، استهلاكك، وفاتورتك — كلها في تطبيق واحد يتكيف مع طريقتك في التعامل مع الكهرباء.
        </div>
      </div>
    </OnboardingLayout>
  );
}
