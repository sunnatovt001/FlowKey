import { Check } from "lucide-react";
export function SetupProgress({ step }: { step: 1 | 2 }) {
  return (
    <ol className="project-setup-progress" aria-label="Boshlang‘ich sozlash">
      <li aria-current={step === 1 ? "step" : undefined}>
        <span>{step === 2 ? <Check size={18} aria-hidden="true" /> : 1}</span>
        Mahsulot
        {step === 2 && (
          <span className="setup-progress-sr"> — yakunlangan</span>
        )}
      </li>
      <li
        aria-current={step === 2 ? "step" : undefined}
        className={step === 1 ? "setup-step-upcoming" : undefined}
      >
        <span>2</span>Loyiha
      </li>
    </ol>
  );
}
