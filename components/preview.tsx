import Link from "next/link";
import {
  ArrowRight,
  FolderPlus,
  KeyRound,
  Link2,
  Activity,
} from "lucide-react";
const steps = [
  {
    icon: FolderPlus,
    title: "Loyiha yarating",
    text: "Mahsulotingizni alohida loyihada boshqaring.",
  },
  {
    icon: KeyRound,
    title: "API kalitini oling",
    text: "Serveringizni FlowKey API’siga ulang.",
  },
  {
    icon: Link2,
    title: "Ulash usulini tanlang",
    text: "API, havola, script yoki tugmadan foydalaning.",
  },
  {
    icon: Activity,
    title: "Natijalarni kuzating",
    text: "Tranzaksiyalar va webhook tarixini tekshiring.",
  },
];
export function ProductPreview() {
  return (
    <div className="product-preview" data-ui>
      <div className="preview-top">
        <span className="project-icon">F</span>
        <strong>FlowKey bilan ishlash</strong>
      </div>
      <div className="preview-body">
        <div>
          <h3>Loyihadan integratsiyagacha.</h3>
          <ol className="flow-workflow">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="preview-bottom">
        <span>API · Havola · Script · Tugma</span>
        <Link href="/docs">
          Qo‘llanma <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
