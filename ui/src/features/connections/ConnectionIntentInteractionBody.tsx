import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plug,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { AI_CONNECTION_CAPABILITIES, aiProviderSchema, type AiAuthMethod, type ConnectionIntentInteraction } from "@paperclipai/shared";
import { AgentMailIntentSetup } from "./AgentMailIntentSetup";
import { connectionIntentsApi } from "@/api/connection-intents";
import { aiConnectionsApi } from "@/api/ai-connections";
import { agentsApi } from "@/api/agents";
import { AiConnectionCredentialStep } from "@/components/ai-connections/AiConnectionCredentialStep";
import { AiProviderSetup } from "@/components/ai-connections/AiProviderSetup";
import { defaultAiConnectionName } from "@/components/ai-connections/model";
import { useTranslation } from "@/i18n";
import { AppLogo } from "@/pages/apps/AppLogo";
import { AgentAvatar } from "@/components/AgentAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ConnectionSetupFlow,
  type ConnectionSetupCompletion,
  type ConnectionSetupFlowProps,
} from "./ConnectionSetupFlow";

export interface ConnectionIntentInteractionBodyProps {
  interaction: ConnectionIntentInteraction;
  currentUserId?: string | null;
  addresseeLabel: string;
  addresseeName?: string;
  renderSetup?: (props: ConnectionSetupFlowProps) => ReactNode;
}

export function ConnectionIntentInteractionBody({
  interaction,
  currentUserId,
  addresseeLabel,
  addresseeName,
  renderSetup,
}: ConnectionIntentInteractionBodyProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [adoptionConnectionId, setAdoptionConnectionId] = useState<string | null>(null);
  const focusTargetRef = useRef<HTMLDivElement>(null);
  const setupGeneration = useRef(0);
  const generation = setupGeneration.current;
  const closeSetup = () => {
    setupGeneration.current += 1;
    selectAiAccountMutation.reset();
    setOpen(false);
  };
  const queryClient = useQueryClient();
  const isAddressee = Boolean(
    currentUserId && interaction.addresseeUserId === currentUserId,
  );
  const isPending = interaction.status === "pending";
  const isAi = interaction.payload.purpose === "ai";
  const provider = isAi ? aiProviderSchema.safeParse(interaction.payload.serviceSlug).data : undefined;
  const serviceName = provider ? AI_CONNECTION_CAPABILITIES[provider].name : interaction.payload.serviceName;
  const isEmail = interaction.payload.purpose === "channel" && interaction.payload.serviceSlug === "agentmail";
  const accessRequest = interaction.payload.accessRequest;
  const agentQuery = useQuery({
    queryKey: ["agents", "detail", interaction.payload.requestingAgentId, interaction.companyId],
    queryFn: () => agentsApi.get(interaction.payload.requestingAgentId, interaction.companyId),
    enabled: Boolean(accessRequest) && isPending,
  });
  const focusTargetId = `connection-intent-focus-target-${interaction.id}`;

  const invalidateTask = async (
    updatedInteraction?: ConnectionIntentInteraction,
  ) => {
    if (updatedInteraction) {
      queryClient.setQueriesData<ConnectionIntentInteraction[]>(
        { queryKey: ["issues", "interactions"] },
        (current) =>
          current?.map((candidate) =>
            candidate.id === updatedInteraction.id
              ? updatedInteraction
              : candidate,
          ),
      );
    }
    await Promise.all([
      // Task routes may key these caches by either UUID or human identifier.
      // Prefix invalidation reaches the mounted task without requiring that
      // routing identity to leak into the reusable interaction card.
      queryClient.invalidateQueries({ queryKey: ["issues", "interactions"] }),
      queryClient.invalidateQueries({ queryKey: ["issues", "detail"] }),
    ]);
  };
  const returnFocusToCard = () => {
    // Completing an intent can move it from the composer takeover to the
    // durable timeline. That replaces this component instance, so its ref can
    // be cleared before focus restoration runs. Retry for a few paint frames
    // and resolve the stable interaction-specific target from the new host.
    const focusCurrentTarget = (remainingAttempts: number) => {
      window.requestAnimationFrame(() => {
        const target =
          document.getElementById(focusTargetId) ?? focusTargetRef.current;
        target?.focus();
        if (remainingAttempts > 1) {
          focusCurrentTarget(remainingAttempts - 1);
        }
      });
    };
    focusCurrentTarget(3);
  };

  const setupQuery = useQuery({
    queryKey: ["connection-intent", interaction.id, "setup-options"],
    queryFn: () => connectionIntentsApi.setupOptions(interaction.id),
    enabled: isAddressee && isPending,
    refetchInterval: isPending && (open || interaction.payload.phase === "authorizing") ? 2_000 : false,
  });

  useEffect(() => {
    const current = setupQuery.data?.interaction;
    if (current && current.status !== "pending" && isPending) {
      void invalidateTask(current);
      setOpen(false);
      returnFocusToCard();
    }
  }, [setupQuery.data?.interaction, isPending]);

  const completeMutation = useMutation({
    mutationFn: (connectionId: string) =>
      connectionIntentsApi.complete(interaction.id, connectionId),
    onSuccess: async (updatedInteraction) => {
      await invalidateTask(updatedInteraction);
      setOpen(false);
      returnFocusToCard();
    },
  });
  const adoptMutation = useMutation({
    mutationFn: (connectionId: string) => agentsApi.adoptAiConnection(
      interaction.payload.requestingAgentId, interaction.id, connectionId, interaction.companyId,
    ),
    onSuccess: async (updatedInteraction) => {
      await invalidateTask(updatedInteraction);
      setAdoptionConnectionId(null);
      setOpen(false);
      returnFocusToCard();
    },
  });
  const declineMutation = useMutation({
    mutationFn: () => connectionIntentsApi.decline(interaction.id),
    onSuccess: async (updatedInteraction) => {
      await invalidateTask(updatedInteraction);
      setOpen(false);
      returnFocusToCard();
    },
  });
  const phaseMutation = useMutation({
    mutationFn: (phase: ConnectionIntentInteraction["payload"]["phase"]) =>
      connectionIntentsApi.setPhase(interaction.id, phase),
    onSuccess: invalidateTask,
  });
  const mutatePhase = phaseMutation.mutate;
  const handlePhaseChange = useCallback(
    (phase: ConnectionIntentInteraction["payload"]["phase"]) =>
      mutatePhase(phase),
    [mutatePhase],
  );

  const finishNewConnection = async (completion: ConnectionSetupCompletion) => {
    // A completed credential save survives cancellation, but an abandoned form
    // must not accept the task request (even if a new form has since opened).
    if (isAi && generation !== setupGeneration.current) {
      await setupQuery.refetch();
      return;
    }
    if (completion.resolvedByCallback) {
      // A browser message cannot establish authorization. Read the durable result.
      const verified = await setupQuery.refetch();
      if (verified.data?.interaction.status !== "accepted") return;
      await invalidateTask(verified.data.interaction);
      setOpen(false);
      returnFocusToCard();
      return;
    }
    if (setupQuery.data?.aiConnectionRequiresAdoption) {
      setAdoptionConnectionId(completion.connectionId);
    } else {
      completeMutation.mutate(completion.connectionId);
    }
  };

  const selectAiAccountMutation = useMutation({
    mutationFn: async (result: { connectionId: string; grantId: string; method: AiAuthMethod; generation: number }) => {
      if (result.generation !== setupGeneration.current) {
        await setupQuery.refetch();
        return;
      }
      const binding = setupQuery.data?.aiConnection;
      const previous = setupQuery.data?.aiRepair?.connection;
      if (binding && previous && result.connectionId !== previous.id) {
        if (binding.mode === "responsible_user") {
          await aiConnectionsApi.setDefault(interaction.companyId, result.grantId);
        } else {
          const agent = await agentsApi.get(interaction.payload.requestingAgentId, interaction.companyId);
          const current = agent.runtimeConfig.aiConnection;
          if (!current || current.mode === "responsible_user" || current.mode === "router" || current.connectionId !== previous.id || current.grantId !== previous.grantId) {
            throw new Error(t("interactions.connectionIntent.agentConnectionChanged"));
          }
          if (result.generation !== setupGeneration.current) return;
          await agentsApi.update(agent.id, {
            runtimeConfig: { ...agent.runtimeConfig, aiConnection: { ...binding, method: result.method, connectionId: result.connectionId, grantId: result.grantId } },
          }, interaction.companyId);
        }
        await queryClient.invalidateQueries({ queryKey: ["ai-connections", interaction.companyId] });
      }
      if (result.generation === setupGeneration.current) await finishNewConnection(result);
    },
  });

  const setupProps: ConnectionSetupFlowProps | null = setupQuery.data ? {
    host: "dialog",
    upstreamServiceName: interaction.payload.upstreamService?.name,
    serviceSlug: interaction.payload.serviceSlug.startsWith("connection:") ? undefined : interaction.payload.serviceSlug,
    configuredConnection: interaction.payload.serviceSlug.startsWith("connection:") ? setupQuery.data.existingConnections[0] : undefined,
    requestedAgentId: setupQuery.data.requestedAgentId,
    aiConnection: setupQuery.data.aiConnection,
    interactionId: interaction.id,
    existingConnections: setupQuery.data.existingConnections,
    onUseExisting: async (connectionId) => { await completeMutation.mutateAsync(connectionId); },
    onComplete: (completion) => { void finishNewConnection(completion); },
    onOAuthDeclined: () => declineMutation.mutate(),
    onPhaseChange: handlePhaseChange,
    onCancel: () => { closeSetup(); returnFocusToCard(); },
  } : null;

  const resultOutcome = interaction.result?.outcome;
  const status =
    interaction.status === "accepted"
      ? {
          icon: CheckCircle2,
          title: accessRequest ? t("interactions.connectionIntent.accessGranted", { service: serviceName }) : interaction.payload.upstreamService ? t("interactions.connectionIntent.externalProviderConnected") : t("interactions.connectionIntent.serviceConnected", { service: serviceName }),
          body: accessRequest ? null : interaction.payload.upstreamService ? t("interactions.connectionIntent.externalProviderConnectedBody", { agent: interaction.payload.requestingAgentName, service: interaction.payload.upstreamService.name }) : isAi ? t("interactions.connectionIntent.agentCanUseConnection") : t("interactions.connectionIntent.agentCanUseConnectionInRun", { agent: interaction.payload.requestingAgentName }),
        }
      : interaction.status === "cancelled"
        ? {
            icon: XCircle,
            title: t("interactions.connectionIntent.requestWithdrawn"),
            body: t("interactions.connectionIntent.requestInactive"),
          }
      : interaction.status === "rejected"
        ? {
            icon: XCircle,
            title: accessRequest ? t("interactions.connectionIntent.accessDeclined") : t("interactions.connectionIntent.connectionDeclined"),
            body: accessRequest ? null : isAi ? t("interactions.connectionIntent.taskNeedsAiConnection") : t("interactions.connectionIntent.agentCanContinueWithoutConnection", { agent: interaction.payload.requestingAgentName }),
          }
        : interaction.status === "expired"
          ? {
              icon: Clock,
              title:
                resultOutcome === "superseded"
                  ? t("interactions.connectionIntent.requestSuperseded")
                  : t("interactions.connectionIntent.requestExpired"),
              body:
                resultOutcome === "superseded"
                  ? t("interactions.connectionIntent.requestReplaced")
                  : // The server stores the reason an expiry happened and what to
                    // do next; without it the card only says the request is gone.
                    interaction.result?.reason?.trim()
                    || t("interactions.connectionIntent.requestInactive"),
            }
          : null;
  const StatusIcon = status?.icon;

  if (status && StatusIcon) {
    return (
      <div
        id={focusTargetId}
        ref={focusTargetRef}
        tabIndex={-1}
        data-testid="connection-intent-focus-target"
      >
        <div
          className="flex items-start gap-3"
          data-testid="connection-intent-terminal"
        >
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">{status.title}</p>
            {status.body ? <p className="mt-1 text-sm text-muted-foreground">{status.body}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (!isAddressee) {
    return (
      <div
        id={focusTargetId}
        ref={focusTargetRef}
        tabIndex={-1}
        data-testid="connection-intent-focus-target"
      >
        <div
          className="flex items-start gap-3"
          data-testid="connection-intent-waiting"
        >
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">
              {t("interactions.connectionIntent.waitingFor", { addressee: addresseeLabel })}
            </p>
            {!accessRequest ? <p className="mt-1 text-sm text-muted-foreground">
              {t("interactions.connectionIntent.onlyAddresseeCanAuthorize")}
            </p> : null}
          </div>
        </div>
      </div>
    );
  }

  const needsRetry = interaction.payload.phase === "needs_retry";
  const authorizing = interaction.payload.phase === "authorizing";

  if (accessRequest) {
    const busy = completeMutation.isPending || declineMutation.isPending;
    return <div id={focusTargetId} ref={focusTargetRef} tabIndex={-1} data-testid="connection-intent-focus-target">
      <div data-testid="connection-intent-access-request" className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <AgentAvatar agent={agentQuery.data ?? { id: interaction.payload.requestingAgentId, name: interaction.payload.requestingAgentName }} size={32} label={interaction.payload.requestingAgentName} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t("interactions.connectionIntent.grantAgentAccess", { agent: interaction.payload.requestingAgentName, connection: accessRequest.connectionName })}</p>
          </div>
          <AppLogo name={interaction.payload.serviceName} logoUrl={interaction.payload.serviceLogoUrl} darkLogoUrl={interaction.payload.serviceDarkLogoUrl} size={32} />
        </div>
        <ul aria-label={t("interactions.connectionIntent.toolPermissions")} className="max-h-48 space-y-2 overflow-y-auto text-xs">
          {accessRequest.tools.map(tool => <li key={tool.catalogEntryId} className="flex items-start justify-between gap-3">
            <span className="min-w-0 break-all font-mono text-foreground">{tool.toolName}</span>
            <span className="shrink-0 text-muted-foreground">{tool.permission === "allowed" ? t("interactions.connectionIntent.allowed") : t("interactions.connectionIntent.askFirst")}</span>
          </li>)}
        </ul>
        {setupQuery.isError || completeMutation.isError || declineMutation.isError ? <p role="alert" className="text-sm text-destructive">{(completeMutation.error ?? declineMutation.error ?? setupQuery.error)?.message ?? t("interactions.connectionIntent.updateAccessRequestFailed")}</p> : null}
        {setupQuery.data?.canGrantAccess === false ? <p role="status" className="text-sm text-muted-foreground">{t("interactions.connectionIntent.connectionManagerRequired")}</p> : null}
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => declineMutation.mutate()}>{t("interactions.connectionIntent.notNow")}</Button>
          <Button size="sm" disabled={busy || !setupQuery.data?.canGrantAccess} onClick={() => completeMutation.mutate(accessRequest.connectionId)}>
            {completeMutation.isPending ? t("interactions.connectionIntent.grantingAccess") : t("interactions.connectionIntent.grantAccess")}
          </Button>
        </div>
      </div>
    </div>;
  }

  const repair = setupQuery.data?.aiRepair;
  const selectedReady = repair && setupQuery.data?.existingConnections.some((connection) => connection.id === repair.connection.id);
  const readyForAdoption = setupQuery.data?.aiConnectionRequiresAdoption
    ? adoptionConnectionId ?? (selectedReady ? repair.connection.id : null)
    : null;
  const setupContent = setupQuery.isLoading ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("interactions.connectionIntent.loadingOptions")}
                </div>
              ) : setupQuery.isError ? (
                <div className="py-8 text-center">
                  <p className="font-medium text-foreground">
                    {t("interactions.connectionIntent.loadFailed")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {setupQuery.error instanceof Error
                      ? setupQuery.error.message
                      : t("interactions.connectionIntent.tryAgain")}
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setupQuery.refetch()}
                  >
                    {t("interactions.connectionIntent.tryAgain")}
                  </Button>
                </div>
              ) : setupProps ? (
                renderSetup ? renderSetup(setupProps) : <ConnectionSetupFlow {...setupProps} />
              ) : null;
  const aiConnection = setupQuery.data?.aiConnection;
  const needsOwnAiConnection = isAi && (!repair || setupQuery.data?.aiConnectionRequiresAdoption) && aiConnection?.mode === "responsible_user";
  const aiProviderName = aiConnection ? AI_CONNECTION_CAPABILITIES[aiConnection.provider].name : serviceName;
  const inlineContent = setupQuery.isLoading || setupQuery.isError ? setupContent
    : readyForAdoption ? <div className="space-y-3">
        <p className="text-sm">
          {t("interactions.connectionIntent.adoptionQuestion", { provider: aiProviderName, agent: interaction.payload.requestingAgentName })}
        </p>
        <Button disabled={adoptMutation.isPending} onClick={() => adoptMutation.mutate(readyForAdoption)}>
          {adoptMutation.isPending ? t("interactions.connectionIntent.checkingConnection") : t("interactions.connectionIntent.useConnectionContinue")}
        </Button>
      </div>
    : selectedReady ? <div className="space-y-3">
        <p className="text-sm">{t("interactions.connectionIntent.connectionReady", { connection: repair.connection.name })}</p>
        <Button disabled={completeMutation.isPending} onClick={() => completeMutation.mutate(repair.connection.id)}>
          {completeMutation.isPending ? t("interactions.connectionIntent.continuing") : t("interactions.connectionIntent.continueTask")}
        </Button>
      </div>
    : repair ? repair.canReconnect ? repair.connection.routing ? <AiProviderSetup
        companyId={interaction.companyId}
        agentId={interaction.payload.requestingAgentId}
        reconnect={repair.connection}
        onComplete={(binding) => selectAiAccountMutation.mutate({ connectionId: binding.connectionId, grantId: binding.grantId, method: binding.method ?? "api_key", generation })}
        onCancel={() => { closeSetup(); returnFocusToCard(); }}
      /> : <AiConnectionCredentialStep
        companyId={interaction.companyId}
        provider={repair.connection.provider}
        initialMethod={repair.connection.method}
        fixedMethod={false}
        connectionId={repair.connection.id}
        name={repair.connection.name}
        nameForMethod={(method) => defaultAiConnectionName(addresseeName ?? addresseeLabel, repair.connection.provider, method, t)}
        hideName
        ownership={repair.connection.ownership}
        agentIds={[interaction.payload.requestingAgentId]}
        allAgents={false}
        onComplete={(result) => selectAiAccountMutation.mutate({ ...result, generation })}
        onCancel={() => { closeSetup(); returnFocusToCard(); }}
      /> : <p role="status" className="text-sm text-muted-foreground">
        {t("interactions.connectionIntent.ownerMustReconnect", { owner: repair.connection.ownership === "personal" ? repair.connection.ownerName ?? t("interactions.connectionIntent.accountOwner") : t("interactions.connectionIntent.accountOwner"), connection: repair.connection.name })}
        {" "}{t("interactions.connectionIntent.continueOnceRestored")}
      </p>
    : aiConnection && aiConnection.mode !== "responsible_user"
      ? <p role="status" className="text-sm text-muted-foreground">{t("interactions.connectionIntent.selectedAccountUnavailable")}</p>
      : aiConnection ? <AiConnectionCredentialStep
          companyId={interaction.companyId}
          provider={aiConnection.provider}
          name={defaultAiConnectionName(addresseeName ?? addresseeLabel, aiConnection.provider, "subscription", t)}
          hideName
          nameForMethod={(method) => defaultAiConnectionName(addresseeName ?? addresseeLabel, aiConnection.provider, method, t)}
          ownership="personal"
          agentIds={[interaction.payload.requestingAgentId]}
          allAgents={false}
          onComplete={(result) => selectAiAccountMutation.mutate({ ...result, generation })}
          onCancel={() => { closeSetup(); returnFocusToCard(); }}
        /> : setupContent;

  return (
    <div
      id={focusTargetId}
      ref={focusTargetRef}
      tabIndex={-1}
      data-testid="connection-intent-focus-target"
    >
      <div data-testid="connection-intent-actions">
        <div className="flex items-start gap-3">
          <AppLogo
            name={interaction.payload.serviceName}
            logoUrl={interaction.payload.serviceLogoUrl}
            darkLogoUrl={interaction.payload.serviceDarkLogoUrl}
            size={40}
          />
          <div>
            <p className="font-medium text-foreground">
              {readyForAdoption ? t("interactions.connectionIntent.useYourAccount", { provider: aiProviderName }) : needsOwnAiConnection ? t("interactions.connectionIntent.connectYourAccount", { provider: aiProviderName }) : isAi ? t("interactions.connectionIntent.authenticationRequired", { provider: aiProviderName }) : t("interactions.connectionIntent.agentNeedsService", { agent: interaction.payload.requestingAgentName, service: interaction.payload.serviceName })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {readyForAdoption
                ? t("interactions.connectionIntent.accountConnectedForAgent", { agent: interaction.payload.requestingAgentName })
                : needsOwnAiConnection
                ? t("interactions.connectionIntent.agentNeedsOwnConnection", { agent: interaction.payload.requestingAgentName })
                : interaction.payload.purpose === "ai"
                ? t("interactions.connectionIntent.taskNeedsConnection")
                : isEmail ? t("interactions.connectionIntent.connectAgentMail")
                : t("interactions.connectionIntent.connectIdentity")}
            </p>
          </div>
        </div>

        {needsRetry ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
            <RotateCcw className="h-4 w-4" />
            {t("interactions.connectionIntent.authorizationRetry")}
          </p>
        ) : null}

        {isEmail ? setupQuery.isLoading || setupQuery.isError ? <>
          {setupContent}
          <Button type="button" variant="ghost" disabled={declineMutation.isPending} onClick={() => declineMutation.mutate()}>{t("interactions.connectionIntent.notNow")}</Button>
        </> : <AgentMailIntentSetup
          companyId={interaction.companyId}
          agentId={interaction.payload.requestingAgentId}
          requestId={interaction.id}
          savedCredentialId={setupQuery.data?.emailSetup?.credentialConnectionId}
          readyConnectionId={setupQuery.data?.emailSetup?.readyConnectionId}
          onComplete={async connectionId => { await completeMutation.mutateAsync(connectionId); }}
          onDecline={() => declineMutation.mutate()}
          declining={declineMutation.isPending}
        /> : <div className="mt-4 flex flex-wrap justify-end gap-2">
          {!isAi && <Button
            type="button"
            variant="ghost"
            disabled={declineMutation.isPending || completeMutation.isPending || authorizing}
            onClick={() => declineMutation.mutate()}
          >
            {t("interactions.connectionIntent.notNow")}
          </Button>}
          {isAi ? <Button type="button" disabled={completeMutation.isPending || adoptMutation.isPending || selectAiAccountMutation.isPending} onClick={() => open ? closeSetup() : setOpen(true)}>
            <Plug className="h-4 w-4" />{open ? t("interactions.connectionIntent.closeSetup") : readyForAdoption ? t("interactions.connectionIntent.continueSetup") : needsOwnAiConnection ? t("interactions.connectionIntent.connectProvider", { provider: aiProviderName }) : t("interactions.connectionIntent.fixConnection")}
          </Button> : <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                {authorizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plug className="h-4 w-4" />
                )}
                {authorizing
                  ? t("interactions.connectionIntent.continueSetup")
                  : needsRetry
                    ? t("interactions.connectionIntent.tryAgain")
                    : setupQuery.data?.existingConnections.length ? t("interactions.connectionIntent.connectOrUseExisting") : t("interactions.connectionIntent.connect")}
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-(--sz-85vh) overflow-y-auto sm:max-w-3xl"
              showCloseButton={false}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                focusTargetRef.current?.focus();
              }}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {t("interactions.connectionIntent.connectService", { service: interaction.payload.serviceName })}
                </DialogTitle>
                <DialogDescription>
                  {t("interactions.connectionIntent.dialogDescription")}
                </DialogDescription>
              </DialogHeader>
              {setupContent}
            </DialogContent>
          </Dialog>}
        </div>}
        {isAi && open ? <div className="mt-4 border-t border-border pt-4" data-testid="ai-connection-inline-repair">{inlineContent}</div> : null}

        {(!isEmail && completeMutation.isError) ||
        (selectAiAccountMutation.isError && selectAiAccountMutation.variables?.generation === generation) ||
        adoptMutation.isError ||
        declineMutation.isError ||
        phaseMutation.isError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {(completeMutation.error ??
              selectAiAccountMutation.error ??
              adoptMutation.error ??
              declineMutation.error ??
              phaseMutation.error) instanceof Error
              ? (
                  completeMutation.error ??
                  selectAiAccountMutation.error ??
                  adoptMutation.error ??
                  declineMutation.error ??
                  phaseMutation.error
                )?.message
              : t("interactions.connectionIntent.updateConnectionRequestFailed")}
          </p>
        ) : null}
        {selectAiAccountMutation.isError && selectAiAccountMutation.variables?.generation === generation && (
          <Button className="mt-3" onClick={() => selectAiAccountMutation.mutate(selectAiAccountMutation.variables!)}>
            {t("interactions.connectionIntent.retryUsingConnection")}
          </Button>
        )}
      </div>
    </div>
  );
}
