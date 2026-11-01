import { PublicNav } from "@/components/common/public-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "./components/hero-section";
import { DeveloperSection } from "./components/developer-section";
import { WorkspaceSection } from "./components/workspace-section";
import { PricingSection } from "./components/pricing-section";
import { FaqSection } from "./components/faq-section";
import { ClosingSection } from "./components/closing-section";
export default function Home(){return <><PublicNav/><main className="landing flow-landing"><HeroSection/><DeveloperSection/><WorkspaceSection/><PricingSection/><FaqSection/><ClosingSection/></main><SiteFooter/></>;}
