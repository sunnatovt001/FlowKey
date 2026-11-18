import { documentationSections } from "./documentation-content";
import { GuideHub } from "./guide-hub";
import "@/styles/guide.css";
export function Documentation({
  workspace = false,
  projectId = "",
  role = "owner",
}: {
  workspace?: boolean;
  projectId?: string;
  role?: string;
}) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return (
    <GuideHub
      workspace={workspace}
      projectId={projectId}
      role={role}
      sections={documentationSections({ base, workspace, projectId })}
    />
  );
}
