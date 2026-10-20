import type {
  WorkspaceOperation,
  WorkspaceReadiness,
  WorkspaceReadinessState,
  WorkspaceRuntimeService,
} from "@paperclipai/shared";
import { t as translate } from "@/i18n";

/**
 * Derives the workspace access state the UI shows (PAP-17572).
 *
 * The board cannot read a cloned workspace's protected health directly, so state
 * comes from three server-side facts it *can* see: the live runtime rows, the
 * workspace operation log, and the readiness the control plane reported when it
 * last tried to mint a login handoff.
 *
 * Every state carries one concrete next action. The failure this replaces was a
 * generic "Load failed" (or worse, a green badge) that told an operator nothing
 * about whether to wait, start, repair, or read a log.
 */

export type WorkspaceAccessActionKind =
  | "open"
  | "start"
  | "repair"
  | "view_logs"
  /** Nothing to do but wait for a running operation. */
  | "wait";

export type WorkspaceAccessAction = {
  kind: WorkspaceAccessActionKind;
  label: string;
};

export type WorkspaceAccessNotice = {
  title: string;
  description: string;
  action: WorkspaceAccessAction;
};

export type WorkspaceAccessDisplayState = WorkspaceReadinessState | "stopped";

export type WorkspaceAccessState = {
  state: WorkspaceAccessDisplayState;
  title: string;
  description: string;
  action: WorkspaceAccessAction;
  /** True when a password-independent handoff is the expected way in. */
  handoffAvailable: boolean;
  /** A non-blocking historical failure that is still useful to inspect. */
  secondaryNotice?: WorkspaceAccessNotice;
};

/** What the control plane said the last time a handoff was requested. */
export type WorkspaceLoginHandoffFailureInfo = {
  reason: string;
  detail?: string | null;
  readiness?: WorkspaceReadiness | null;
};

function latestOperation(operations: WorkspaceOperation[], phase: WorkspaceOperation["phase"]) {
  return operations.find((operation) => operation.phase === phase) ?? null;
}

function describeSeedPhase(readiness: WorkspaceReadiness | null | undefined): string | null {
  if (!readiness?.failurePhase && !readiness?.seedPhase) return null;
  return readiness.failurePhase ?? readiness.seedPhase ?? null;
}

function timestampMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function failedRepairNotice(repair: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
  return {
    title: translate("miscSettingsPage.workspaceAccess.repairFailedTitle"),
    description: phase
      ? translate("miscSettingsPage.workspaceAccess.repairFailedDuring", { phase })
      : translate("miscSettingsPage.workspaceAccess.repairFailedGeneric"),
    action: {
      kind: "view_logs",
      label: translate("miscSettingsPage.workspaceAccess.viewRepairLog"),
    },
  };
}

function failedProvisionNotice(provision: WorkspaceOperation): WorkspaceAccessNotice {
  const phase = typeof provision.metadata?.seedFailurePhase === "string"
    ? provision.metadata.seedFailurePhase
    : null;
  return {
    title: translate("miscSettingsPage.workspaceAccess.provisioningFailedTitle"),
    description: phase
      ? translate("miscSettingsPage.workspaceAccess.provisionFailedDuring", { phase })
      : translate("miscSettingsPage.workspaceAccess.provisionFailedSuperseded"),
    action: {
      kind: "view_logs",
      label: translate("miscSettingsPage.workspaceAccess.viewProvisioningLog"),
    },
  };
}

const HANDOFF_REASON_KEYS: Record<string, string> = {
  handoff_not_configured:
    "miscSettingsPage.workspaceAccess.handoffReasons.handoffNotConfigured",
  no_board_identity:
    "miscSettingsPage.workspaceAccess.handoffReasons.noBoardIdentity",
  runtime_not_running: "miscSettingsPage.workspaceAccess.handoffReasons.runtimeNotRunning",
  runtime_url_unusable: "miscSettingsPage.workspaceAccess.handoffReasons.runtimeUrlUnusable",
  workspace_not_ready: "miscSettingsPage.workspaceAccess.handoffReasons.workspaceNotReady",
};

const READINESS_FAILURE_KEYS: Record<string, string> = {
  database_unreachable: "miscSettingsPage.workspaceAccess.readinessFailures.databaseUnreachable",
  clone_data_missing: "miscSettingsPage.workspaceAccess.readinessFailures.cloneDataMissing",
  clone_data_unreadable: "miscSettingsPage.workspaceAccess.readinessFailures.cloneDataUnreadable",
  cloned_membership_missing:
    "miscSettingsPage.workspaceAccess.readinessFailures.clonedMembershipMissing",
  cloned_identity_unreadable:
    "miscSettingsPage.workspaceAccess.readinessFailures.clonedIdentityUnreadable",
  auth_handoff_not_configured:
    "miscSettingsPage.workspaceAccess.readinessFailures.authHandoffNotConfigured",
  seed_manifest_unreadable:
    "miscSettingsPage.workspaceAccess.readinessFailures.seedManifestUnreadable",
};

/**
 * Human cause for a readiness rejection, preferring the specific recorded phase
 * over a generic sentence so the copy names what to fix.
 */
export function describeWorkspaceReadinessCause(
  failure: WorkspaceLoginHandoffFailureInfo | null | undefined,
): string | null {
  if (!failure) return null;
  const phase = describeSeedPhase(failure.readiness);
  if (phase && READINESS_FAILURE_KEYS[phase]) return translate(READINESS_FAILURE_KEYS[phase]);
  if (phase) return translate("miscSettingsPage.workspaceAccess.lastRecordedPhase", { phase });
  if (failure.detail && READINESS_FAILURE_KEYS[failure.detail]) {
    return translate(READINESS_FAILURE_KEYS[failure.detail]);
  }
  const reasonKey = HANDOFF_REASON_KEYS[failure.reason];
  return reasonKey ? translate(reasonKey) : null;
}

export function resolveWorkspaceAccessState(input: {
  runtimeServices: WorkspaceRuntimeService[] | null | undefined;
  operations: WorkspaceOperation[] | null | undefined;
  handoffFailure?: WorkspaceLoginHandoffFailureInfo | null;
}): WorkspaceAccessState {
  const operations = input.operations ?? [];
  const runtimeServices = input.runtimeServices ?? [];
  const repair = latestOperation(operations, "workspace_repair");
  const provision =
    latestOperation(operations, "workspace_seed")
    ?? latestOperation(operations, "workspace_runtime_provision")
    ?? latestOperation(operations, "workspace_provision");
  const failure = input.handoffFailure ?? null;
  const cause = describeWorkspaceReadinessCause(failure);
  const handoffAvailable = failure?.reason !== "handoff_not_configured" && failure?.reason !== "no_board_identity";
  const servingService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus === "healthy" && service.url,
  );
  const startingService = runtimeServices.find(
    (service) => service.status === "provisioning" || service.status === "starting",
  );
  const repairFinishedAt = timestampMs(repair?.finishedAt);
  const servingServiceStartedAt = timestampMs(servingService?.startedAt);
  const provisionFinishedAt = timestampMs(provision?.finishedAt);
  const readinessConfirmsServing = Boolean(servingService && failure?.readiness?.state === "ready");
  const runtimeStartedAfterRepair = repairFinishedAt !== null
    && servingServiceStartedAt !== null
    && repairFinishedAt < servingServiceStartedAt;
  const repairFailureWasSuperseded = repair?.status === "failed" && Boolean(
    servingService
    && (readinessConfirmsServing || runtimeStartedAfterRepair),
  );
  const successfulRepairFinishedAt = repair?.status === "succeeded"
    ? timestampMs(repair.finishedAt)
    : null;
  // A failed seed is historical once the workspace is demonstrably serving,
  // or once a later repair has replaced and revalidated that database.
  const provisionFailureWasSuperseded = provision?.status === "failed" && Boolean(
    servingService
    || (
      provisionFinishedAt !== null
      && successfulRepairFinishedAt !== null
      && provisionFinishedAt < successfulRepairFinishedAt
    ),
  );
  const secondaryNotice = repair?.status === "failed" && repairFailureWasSuperseded
    ? failedRepairNotice(repair)
    : provision?.status === "failed" && provisionFailureWasSuperseded
      ? failedProvisionNotice(provision)
      : undefined;

  // A live repair outranks everything: it is already changing the answer.
  if (repair?.status === "running") {
    const phase = typeof repair.metadata?.repairPhase === "string" ? repair.metadata.repairPhase : null;
    return {
      state: "repairing",
      title: translate("miscSettingsPage.workspaceAccess.repairingTitle"),
      description: phase
        ? translate("miscSettingsPage.workspaceAccess.repairingDescriptionWithPhase", { phase })
        : translate("miscSettingsPage.workspaceAccess.repairingDescription"),
      action: {
        kind: "wait",
        label: translate("miscSettingsPage.workspaceAccess.repairInProgress"),
      },
      handoffAvailable,
    };
  }
  if (repair?.status === "failed" && !repairFailureWasSuperseded) {
    const notice = failedRepairNotice(repair);
    return {
      state: "failed",
      ...notice,
      handoffAvailable,
    };
  }

  if (provision?.status === "running") {
    return {
      state: "provisioning",
      title: translate("miscSettingsPage.workspaceAccess.provisioningTitle"),
      description: translate("miscSettingsPage.workspaceAccess.provisioningDescription"),
      action: {
        kind: "wait",
        label: translate("miscSettingsPage.workspaceAccess.provisioningAction"),
      },
      handoffAvailable,
    };
  }
  if (provision?.status === "failed" && !provisionFailureWasSuperseded) {
    const seedPhase = typeof provision.metadata?.seedFailurePhase === "string"
      ? provision.metadata.seedFailurePhase
      : null;
    return {
      state: "failed",
      title: translate("miscSettingsPage.workspaceAccess.provisioningFailedTitle"),
      description: seedPhase
        ? translate("miscSettingsPage.workspaceAccess.provisioningFailedWithPhase", { phase: seedPhase })
        : translate("miscSettingsPage.workspaceAccess.provisioningFailedNoDatabase"),
      action: {
        kind: "repair",
        label: translate("miscSettingsPage.workspaceAccess.repairWorkspace"),
      },
      handoffAvailable,
    };
  }

  // Readiness the control plane actually observed beats anything inferred from
  // runtime rows, because it is the only signal that looked inside the clone.
  const staleNotReadyFailure = failure?.reason === "workspace_not_ready" && readinessConfirmsServing;
  if (failure && !staleNotReadyFailure) {
    if (failure.reason === "runtime_not_running" && !servingService && !startingService) {
      return {
        state: "stopped",
        title: translate("miscSettingsPage.workspaceAccess.stoppedTitle"),
        description: translate("miscSettingsPage.workspaceAccess.stoppedDescription"),
        action: {
          kind: "start",
          label: translate("miscSettingsPage.workspaceAccess.startWorkspace"),
        },
        handoffAvailable,
      };
    }
    if (failure.reason === "workspace_not_ready" || failure.reason === "runtime_url_unusable") {
      const readinessState = failure.readiness?.state;
      const validating = readinessState === "validating" || readinessState === "provisioning";
      return {
        state: validating ? "validating" : "degraded",
        title: validating
          ? translate("miscSettingsPage.workspaceAccess.validatingCloneTitle")
          : translate("miscSettingsPage.workspaceAccess.degradedTitle"),
        description: [
          cause ?? translate("miscSettingsPage.workspaceAccess.degradedCloneContract"),
          validating
            ? translate("miscSettingsPage.workspaceAccess.validatingDescription")
            : translate("miscSettingsPage.workspaceAccess.degradedRepairDescription"),
        ].join(" "),
        action: validating
          ? { kind: "wait", label: translate("miscSettingsPage.workspaceAccess.validatingAction") }
          : {
              kind: "repair",
              label: translate("miscSettingsPage.workspaceAccess.repairWorkspace"),
            },
        handoffAvailable,
      };
    }
    if (!handoffAvailable) {
      return {
        state: servingService ? "ready" : "degraded",
        title: servingService
          ? translate("miscSettingsPage.workspaceAccess.readySnapshotSignIn")
          : translate("miscSettingsPage.workspaceAccess.degradedTitle"),
        description: cause
          ?? translate("miscSettingsPage.workspaceAccess.snapshotSignInDescription"),
        action: servingService
          ? {
              kind: "open",
              label: translate("miscSettingsPage.workspaceAccess.openWorkspace"),
            }
          : {
              kind: "start",
              label: translate("miscSettingsPage.workspaceAccess.startWorkspace"),
            },
        handoffAvailable: false,
        secondaryNotice,
      };
    }
  }

  if (startingService) {
    return {
      state: "provisioning",
      title: translate("miscSettingsPage.workspaceAccess.startingTitle"),
      description: translate("miscSettingsPage.workspaceAccess.startingDescription"),
      action: {
        kind: "wait",
        label: translate("miscSettingsPage.workspaceAccess.startingAction"),
      },
      handoffAvailable,
    };
  }

  if (servingService) {
    return {
      state: "ready",
      title: translate("miscSettingsPage.workspaceAccess.readyTitle"),
      description: translate("miscSettingsPage.workspaceAccess.readyDescription"),
      action: {
        kind: "open",
        label: translate("miscSettingsPage.workspaceAccess.openWorkspace"),
      },
      handoffAvailable,
      secondaryNotice,
    };
  }

  const unhealthyService = runtimeServices.find(
    (service) => service.status === "running" && service.healthStatus !== "healthy",
  );
  if (unhealthyService) {
    return {
      state: "degraded",
      title: translate("miscSettingsPage.workspaceAccess.degradedTitle"),
      description: cause
        ?? translate("miscSettingsPage.workspaceAccess.degradedUnhealthyDescription"),
      action: {
        kind: "repair",
        label: translate("miscSettingsPage.workspaceAccess.repairWorkspace"),
      },
      handoffAvailable,
    };
  }

  return {
    state: "stopped",
    title: translate("miscSettingsPage.workspaceAccess.stoppedTitle"),
    description: translate("miscSettingsPage.workspaceAccess.stoppedDescription"),
    action: {
      kind: "start",
      label: translate("miscSettingsPage.workspaceAccess.startWorkspace"),
    },
    handoffAvailable,
  };
}
