import type { CompanySkill } from '@paperclipai/shared';
import { Link } from '@/lib/router';
import { t as translate } from '@/i18n';
export function SkillSourceProvenance({ skill }: { skill: CompanySkill }) {
  const id = skill.metadata?.skillSourceId ?? skill.metadata?.legacySkillSourceId;
  if (typeof id !== 'string') return null;
  const state = skill.metadata?.skillSourceState;
  const label = !skill.metadata?.skillSourceId ? translate('remainingSurfaces.skillFiles.refreshSource') : state === 'removed' ? translate('remainingSurfaces.skillFiles.sourceRemoved')
    : state === 'not_syncing' ? translate('remainingSurfaces.skillFiles.sourceNotSyncing')
    : state === 'update_failed' ? translate('remainingSurfaces.skillFiles.sourceUpdateFailed') : translate('remainingSurfaces.skillFiles.syncedFromGitHub');
  return <div className="flex flex-col gap-1 py-3 text-xs text-muted-foreground">
    <span>{label}</span>
    <span className="break-all font-mono">{String(skill.metadata?.skillSourcePath ?? '')}{skill.sourceRef ? ` · ${skill.sourceRef.slice(0, 8)}` : ''}</span>
    <Link to={`/skills/sources/${id}`} className="text-foreground underline">{translate('remainingSurfaces.skillFiles.manageSource')}</Link>
  </div>;
}
