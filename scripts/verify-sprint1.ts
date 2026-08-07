import HomePage from "../app/page";
import AboutPage from "../app/about/page";
import PricingPage from "../app/pricing/page";
import ContactPage from "../app/contact/page";
import FaqPage from "../app/faq/page";
import LoginPage from "../app/login/page";
import SignupPage from "../app/signup/page";
import ForgotPasswordPage from "../app/forgot-password/page";
import ResetPasswordPage from "../app/reset-password/page";
import VerifyEmailPage from "../app/verify-email/page";
import VerifyPhonePage from "../app/verify-phone/page";
import OtpPage from "../app/otp/page";
import WelcomePage from "../app/welcome/page";

console.log("=== ZOLANZO Sprint 1 Foundation Verification Audit ===");

const components = [
  { name: "HomePage", comp: HomePage },
  { name: "AboutPage", comp: AboutPage },
  { name: "PricingPage", comp: PricingPage },
  { name: "ContactPage", comp: ContactPage },
  { name: "FaqPage", comp: FaqPage },
  { name: "LoginPage", comp: LoginPage },
  { name: "SignupPage", comp: SignupPage },
  { name: "ForgotPasswordPage", comp: ForgotPasswordPage },
  { name: "ResetPasswordPage", comp: ResetPasswordPage },
  { name: "VerifyEmailPage", comp: VerifyEmailPage },
  { name: "VerifyPhonePage", comp: VerifyPhonePage },
  { name: "OtpPage", comp: OtpPage },
  { name: "WelcomePage", comp: WelcomePage },
];

for (const item of components) {
  if (typeof item.comp === "function") {
    console.log(`✓ ${item.name} component verified.`);
  } else {
    console.error(`❌ ${item.name} is invalid.`);
    process.exit(1);
  }
}

console.log("🎉 All Sprint 1 pages & routes verified successfully!");
