import { GitBranch, LoaderCircle } from 'lucide-react';
import { SearchableSelect, type SearchableSelectGroup, type SearchableSelectOption } from '@/components/SearchableSelect';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export interface RepositoryBranch {
  name: string;
  isDefault?: boolean;
}

interface BranchOption extends SearchableSelectOption {
  isDefault?: boolean;
  entered?: boolean;
}

export function RepositoryBranchSelect({ value, branches, loading, error, disabled, onChange, onRetry }: {
  value: string;
  branches: readonly RepositoryBranch[];
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  onChange: (branch: string) => void;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const uniqueBranches = [...new Map(branches.map(branch => [branch.name, branch])).values()];
  const options: BranchOption[] = uniqueBranches.map(branch => ({ key: branch.name, value: branch.name, label: branch.name, searchText: branch.isDefault ? t('skillsPage.skillSources.branchRepair.selector.defaultGroup') : undefined, isDefault: branch.isDefault }));
  if (value && !options.some(option => option.value === value)) options.push({ key: value, value, label: value });
  const groups: SearchableSelectGroup<string, BranchOption>[] = [
    { id: 'default', label: t('skillsPage.skillSources.branchRepair.selector.defaultGroup'), options: options.filter(option => option.isDefault) },
    { id: 'branches', label: t('skillsPage.skillSources.branchRepair.selector.branchesGroup'), options: options.filter(option => !option.isDefault) },
  ];
  return <div className="flex min-w-0 flex-col gap-2">
    <SearchableSelect<string, BranchOption>
      value={value} groups={groups} disabled={disabled} triggerAriaLabel={t('skillsPage.skillSources.branchRepair.selector.branchAria')} mobileTitle={t('skillsPage.skillSources.branchRepair.selector.chooseBranch')}
      placeholder={t('skillsPage.skillSources.branchRepair.selector.chooseBranch')} searchPlaceholder={t('skillsPage.skillSources.branchRepair.selector.searchBranch')}
      emptyMessage={loading ? t('skillsPage.skillSources.branchRepair.selector.loadingBranches') : t('skillsPage.skillSources.branchRepair.selector.noMatchingBranches')}
      onValueChange={branch => onChange(branch)}
      deriveGroups={(query, current) => {
        const name = query.trim();
        return name && !options.some(option => option.value === name)
          ? [...current, { id: 'entered', options: [{ key: `entered:${name}`, value: name, label: name, entered: true }] }]
          : current;
      }}
      renderOption={option => <>
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate" title={option.value}>{option.entered ? t('skillsPage.skillSources.branchRepair.selector.useBranch', { branch: option.value }) : option.label}</span>
        {option.isDefault && <span className="text-xs text-muted-foreground">{t('skillsPage.skillSources.branchRepair.selector.defaultBadge')}</span>}
      </>}
    />
    {loading && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />{t('skillsPage.skillSources.branchRepair.selector.loading')}</p>}
    {error && <div className="flex flex-wrap items-center gap-2"><p role="alert" className="text-sm text-destructive">{error} {t('skillsPage.skillSources.branchRepair.selector.enterBranch')}</p>
      {onRetry && <Button type="button" size="sm" variant="ghost" disabled={loading || disabled} onClick={onRetry}>{t('skillsPage.skillSources.branchRepair.selector.tryAgain')}</Button>}
    </div>}
  </div>;
}
