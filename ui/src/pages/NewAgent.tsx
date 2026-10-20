import { useEffect } from "react";
import { useTranslation } from "@/i18n";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { NewAgentSetup } from "../components/new-agent/NewAgentSetup";

export function NewAgent() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([
      { label: t("nav.agents"), href: "/agents" },
      { label: t("agentsPage.newAgent.breadcrumb") },
    ]);
  }, [setBreadcrumbs, t]);
  return <NewAgentSetup />;
}
