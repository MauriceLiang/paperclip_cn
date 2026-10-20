import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus2 } from "lucide-react";
import type {
  HumanCompanyMembershipRole,
  InviteJoinType,
  JoinRequestStatus,
  JoinRequestType,
} from "@paperclipai/shared";
import { useTranslation } from "@/i18n";
import { formatDateTime } from "@/i18n/formatters";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

const JOIN_REQUEST_STATUS_KEYS: Record<JoinRequestStatus, string> = {
  pending_approval: "inboxExtra.joinRequestQueue.status.pendingApproval",
  approved: "inboxExtra.joinRequestQueue.status.approved",
  rejected: "inboxExtra.joinRequestQueue.status.rejected",
};
const JOIN_REQUEST_TYPE_KEYS: Record<JoinRequestType, string> = {
  human: "inboxExtra.joinRequestQueue.humanType",
  agent: "inboxExtra.joinRequestQueue.agentType",
};
const INVITE_JOIN_TYPE_KEYS: Record<InviteJoinType, string> = {
  human: "inboxExtra.joinRequestQueue.inviteTypes.human",
  agent: "inboxExtra.joinRequestQueue.inviteTypes.agent",
  both: "inboxExtra.joinRequestQueue.inviteTypes.both",
};
const MEMBERSHIP_ROLE_KEYS: Record<HumanCompanyMembershipRole, string> = {
  owner: "settingsPage.access.roles.owner",
  admin: "settingsPage.access.roles.admin",
  operator: "settingsPage.access.roles.operator",
  viewer: "settingsPage.access.roles.viewer",
};

export function JoinRequestQueue() {
  const { t } = useTranslation();
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"pending_approval" | "approved" | "rejected">("pending_approval");
  const [requestType, setRequestType] = useState<"all" | "human" | "agent">("all");

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("inboxExtra.joinRequestQueue.organization"), href: "/dashboard" },
      { label: t("inboxExtra.title"), href: "/inbox" },
      { label: t("inboxExtra.joinRequestQueue.title") },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs, t]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId ?? "", `${status}:${requestType}`),
    queryFn: () =>
      accessApi.listJoinRequests(
        selectedCompanyId!,
        status,
        requestType === "all" ? undefined : requestType,
      ),
    enabled: !!selectedCompanyId,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.approveJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyMembers(selectedCompanyId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!) });
      pushToast({ title: t("settingsPage.access.toast.joinRequestApproved"), tone: "success" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.rejectJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      pushToast({ title: t("settingsPage.access.toast.joinRequestRejected"), tone: "success" });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">{t("inboxExtra.joinRequestQueue.selectOrganization")}</div>;
  }

  if (requestsQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("inboxExtra.joinRequestQueue.loading")}</div>;
  }

  if (requestsQuery.error) {
    const message =
      requestsQuery.error instanceof ApiError && requestsQuery.error.status === 403
        ? t("inboxExtra.joinRequestQueue.permissionDenied")
        : requestsQuery.error instanceof Error
          ? requestsQuery.error.message
          : t("inboxExtra.joinRequestQueue.loadFailed");
    return <div className="text-sm text-destructive">{message}</div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("inboxExtra.joinRequestQueue.title")}</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("inboxExtra.joinRequestQueue.description")}
        </p>
      </div>

      <Card className="flex-row flex-wrap gap-3 p-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium">{t("inboxExtra.joinRequestQueue.statusFilter")}</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "pending_approval" | "approved" | "rejected")
            }
          >
            <option value="pending_approval">{t(JOIN_REQUEST_STATUS_KEYS.pending_approval)}</option>
            <option value="approved">{t(JOIN_REQUEST_STATUS_KEYS.approved)}</option>
            <option value="rejected">{t(JOIN_REQUEST_STATUS_KEYS.rejected)}</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">{t("inboxExtra.joinRequestQueue.typeFilter")}</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={requestType}
            onChange={(event) =>
              setRequestType(event.target.value as "all" | "human" | "agent")
            }
          >
            <option value="all">{t("inboxExtra.joinRequestQueue.allTypes")}</option>
            <option value="human">{t(JOIN_REQUEST_TYPE_KEYS.human)}</option>
            <option value="agent">{t(JOIN_REQUEST_TYPE_KEYS.agent)}</option>
          </select>
        </label>
      </Card>

      <div className="space-y-4">
        {(requestsQuery.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            {t("inboxExtra.joinRequestQueue.empty")}
          </div>
        ) : (
          requestsQuery.data!.map((request) => (
            <Card key={request.id} className="block p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={request.status === "pending_approval" ? "secondary" : request.status === "approved" ? "outline" : "destructive"}>
                      {t(JOIN_REQUEST_STATUS_KEYS[request.status])}
                    </Badge>
                    <Badge variant="outline">{t(JOIN_REQUEST_TYPE_KEYS[request.requestType])}</Badge>
                    {request.adapterType ? <Badge variant="outline">{request.adapterType}</Badge> : null}
                  </div>
                  <div>
                    <div className="text-base font-medium">
                      {request.requestType === "human"
                        ? request.requesterUser?.name || request.requestEmailSnapshot || request.requestingUserId || t("settingsPage.access.unknownHumanRequester")
                        : request.agentName || t("inboxExtra.joinRequestQueue.unknownAgentRequester")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.requestType === "human"
                        ? request.requesterUser?.email || request.requestEmailSnapshot || request.requestingUserId
                        : request.capabilities || request.requestIp}
                    </div>
                  </div>
                </div>

                {request.status === "pending_approval" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {t("common.reject")}
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                    >
                      {t("common.approve")}
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">
                    {t("inboxExtra.joinRequestQueue.inviteContext")}
                  </div>
                  <div className="mt-2">
                    {request.invite
                      ? <>
                          {t("settingsPage.access.joinInvite", {
                            types: t(INVITE_JOIN_TYPE_KEYS[request.invite.allowedJoinTypes]),
                          })}
                          {request.invite.humanRole
                            ? ` · ${t("settingsPage.access.defaultRole", {
                                role: t(MEMBERSHIP_ROLE_KEYS[request.invite.humanRole]),
                              })}`
                            : ""}
                        </>
                      : t("settingsPage.access.inviteMetadataUnavailable")}
                  </div>
                  {request.invite?.inviteMessage ? (
                    <div className="mt-2 text-foreground">{request.invite.inviteMessage}</div>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">
                    {t("inboxExtra.joinRequestQueue.requestDetails")}
                  </div>
                  <div className="mt-2">
                    {t("settingsPage.access.submittedAt", { date: formatDateTime(request.createdAt) })}
                  </div>
                  <div>{t("inboxExtra.joinRequestQueue.sourceIp")} {request.requestIp}</div>
                  {request.requestType === "agent" && request.capabilities ? <div>{request.capabilities}</div> : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
