import { useEffect } from "react";
import { Link2 } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { DecisionModelSettingsSection } from "../components/decision-models/DecisionModelSettings";
import { FastResponseSettingsSection } from "../components/fast-responses/FastResponseSettings";
import { useFastResponsesEnabled } from "../hooks/useFastResponsesEnabled";
import { useTranslation } from "@/i18n";
import { Navigate } from "@/lib/router";

export function CompanyConnections() {
  const { t } = useTranslation();
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { enabled, loaded } = useFastResponsesEnabled();

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("common.organization"), href: "/dashboard" },
      { label: t("nav.settings"), href: "/company/settings" },
      { label: t("settingsNav.connections") },
    ]);
  }, [setBreadcrumbs, selectedCompany?.name, t]);

  if (!loaded) return null;
  if (!enabled) return <Navigate to="/company/settings" replace />;

  if (!selectedCompanyId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("toolsPage.companyConnections.noOrganization")}
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{t("toolsPage.companyConnections.title")}</h1>
      </div>
      <DecisionModelSettingsSection key={selectedCompanyId} companyId={selectedCompanyId} />
      <div className="max-w-2xl border-t border-border pt-8">
        <FastResponseSettingsSection key={`fast-${selectedCompanyId}`} companyId={selectedCompanyId} />
      </div>
    </div>
  );
}
