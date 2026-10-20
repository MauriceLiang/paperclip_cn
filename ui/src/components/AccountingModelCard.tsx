import { Database, Gauge, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/i18n";

const SURFACES = [
  {
    titleKey: "operationsPage.costs.accountingModel.inference.title",
    descriptionKey: "operationsPage.costs.accountingModel.inference.description",
    icon: Database,
    pointKeys: [
      "operationsPage.costs.accountingModel.inference.tokensAndBilledDollars",
      "operationsPage.costs.accountingModel.inference.providerBillerModel",
      "operationsPage.costs.accountingModel.inference.subscriptionAndOverageAware",
    ],
    tone: "from-sky-500/12 via-sky-500/6 to-transparent",
  },
  {
    titleKey: "operationsPage.costs.financeTitle",
    descriptionKey: "operationsPage.costs.financeDescription",
    icon: ReceiptText,
    pointKeys: [
      "operationsPage.costs.accountingModel.finance.topUpsRefundsFees",
      "operationsPage.costs.accountingModel.finance.bedrockCharges",
      "operationsPage.costs.accountingModel.finance.creditAdjustments",
    ],
    tone: "from-amber-500/14 via-amber-500/6 to-transparent",
  },
  {
    titleKey: "operationsPage.costs.accountingModel.liveQuotas.title",
    descriptionKey: "operationsPage.costs.accountingModel.liveQuotas.description",
    icon: Gauge,
    pointKeys: [
      "operationsPage.costs.accountingModel.liveQuotas.providerWindows",
      "operationsPage.costs.accountingModel.liveQuotas.billerCreditSystems",
      "operationsPage.costs.accountingModel.liveQuotas.errorsSurfacedDirectly",
    ],
    tone: "from-emerald-500/14 via-emerald-500/6 to-transparent",
  },
] as const;

export function AccountingModelCard() {
  const { t } = useTranslation();
  return (
    <Card className="relative overflow-hidden border-border/70">
      <div className="absolute inset-0 bg-(image:--gradient-extract-3)" />
      <CardHeader className="relative px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-(--tracking-caps) text-muted-foreground">
          {t("operationsPage.costs.accountingModel.title")}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">
          {t("operationsPage.costs.accountingModel.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid gap-3 px-5 pb-5 md:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <div
              key={surface.titleKey}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${surface.tone} p-4 shadow-sm`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t(surface.titleKey)}</div>
                  <div className="text-xs text-muted-foreground">{t(surface.descriptionKey)}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {surface.pointKeys.map((key) => (
                  <div key={key}>{t(key)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
