import { css, cx } from '@emotion/css';
import { useCallback, useMemo, useState } from 'react';

import { escapeRegex, FIELD_NAME_FACET_KEY, type GrafanaTheme2, parseFlags } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';

import { useStyles2 } from '../../themes/ThemeContext';
import { FilterInput } from '../FilterInput/FilterInput';
import { Checkbox } from '../Forms/Checkbox';
import { Icon } from '../Icon/Icon';

export interface FacetedLabelsFilterProps {
  /** Map of label keys to their sorted unique values, from extractFacetedLabels */
  labels: Record<string, string[]>;
  /** Currently selected label values, keyed by label key */
  selected: Record<string, string[]>;
  /** Called when the selection changes */
  onChange: (selected: Record<string, string[]>) => void;
  /** When true the filter is dimmed to indicate the legend has taken precedence */
  dimmed?: boolean;
}

/**
 * Label values usually come from Prometheus or Loki, so the search is a regular expression that also accepts
 * RE2-style inline flags such as (?-i). It is case-insensitive unless the search turns that off.
 * A search that isn't a valid regular expression is matched as plain text.
 */
function getSearchRegex(search: string): RegExp {
  const { cleaned, flags } = parseFlags(`(?i)${search}`);

  try {
    return new RegExp(cleaned, flags);
  } catch {
    return new RegExp(escapeRegex(cleaned), flags);
  }
}

export function FacetedLabelsFilter({ labels, selected, onChange, dimmed }: FacetedLabelsFilterProps) {
  const styles = useStyles2(getStyles);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const labelKeys = Object.keys(labels);

  const searchRegex = useMemo(() => (search ? getSearchRegex(search) : undefined), [search]);

  const visibleLabels = useMemo(() => {
    if (!searchRegex) {
      return labels;
    }

    const matching: Record<string, string[]> = {};
    for (const [key, values] of Object.entries(labels)) {
      const matchingValues = values.filter((value) => searchRegex.test(value));
      if (matchingValues.length > 0) {
        matching[key] = matchingValues;
      }
    }
    return matching;
  }, [labels, searchRegex]);

  const toggleExpanded = useCallback((key: string, expanded: boolean) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !expanded }));
  }, []);

  const toggleValue = useCallback(
    (key: string, value: string) => {
      const current = selected[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

      onChange({ ...selected, [key]: next });
    },
    [selected, onChange]
  );

  const toggleAllForKey = useCallback(
    (key: string, values: string[]) => {
      const current = selected[key] ?? [];
      const allSelected = values.every((value) => current.includes(value));
      const next = allSelected
        ? current.filter((value) => !values.includes(value))
        : (labels[key] ?? []).filter((value) => current.includes(value) || values.includes(value));

      onChange({ ...selected, [key]: next });
    },
    [labels, selected, onChange]
  );

  const seriesValues = labels[FIELD_NAME_FACET_KEY];
  const realLabelKeys = labelKeys.filter((key) => key !== FIELD_NAME_FACET_KEY);

  if (!seriesValues && realLabelKeys.length === 0) {
    return null;
  }

  const isSearching = Boolean(searchRegex);
  const visibleSeriesValues = visibleLabels[FIELD_NAME_FACET_KEY];
  const visibleLabelKeys = realLabelKeys.filter((key) => visibleLabels[key]);

  const renderCheckboxList = (key: string, values: string[], className: string) => {
    const selectedValues = selected[key] ?? [];
    const allSelected = values.every((value) => selectedValues.includes(value));
    return (
      <div className={className}>
        {values.map((value) => (
          <Checkbox
            key={value}
            label={value}
            value={selectedValues.includes(value)}
            onChange={() => toggleValue(key, value)}
            className={styles.checkbox}
          />
        ))}
        <button type="button" className={styles.toggleAll} onClick={() => toggleAllForKey(key, values)}>
          {allSelected ? (
            <Trans i18nKey="grafana-ui.viz-legend.faceted-deselect-all">Deselect all</Trans>
          ) : (
            <Trans i18nKey="grafana-ui.viz-legend.faceted-select-all">Select all</Trans>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className={cx(styles.container, dimmed && styles.dimmed)} data-testid="faceted-labels-filter">
      <div className={styles.search}>
        <FilterInput
          value={search}
          onChange={setSearch}
          escapeRegex={false}
          variant="filter"
          hideClearText
          placeholder={t('grafana-ui.viz-legend.faceted-search-placeholder', 'Search')}
        />
      </div>

      {visibleSeriesValues && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            <Trans i18nKey="grafana-ui.viz-legend.faceted-by-name">By name</Trans>
          </span>
          {renderCheckboxList(FIELD_NAME_FACET_KEY, visibleSeriesValues, styles.checkboxList)}
        </div>
      )}

      {visibleLabelKeys.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            <Trans i18nKey="grafana-ui.viz-legend.faceted-by-labels">By labels</Trans>
          </span>
          {visibleLabelKeys.map((key) => {
            const selectedValues = selected[key] ?? [];
            const isExpanded = expandedKeys[key] ?? isSearching;
            return (
              <div key={key} className={styles.labelGroup}>
                <button type="button" className={styles.labelKey} onClick={() => toggleExpanded(key, isExpanded)}>
                  <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="sm" />
                  <span className={styles.keyName}>{key}</span>
                  {selectedValues.length > 0 && <span className={styles.count}>{selectedValues.length}</span>}
                </button>
                {isExpanded && renderCheckboxList(key, visibleLabels[key], styles.checkboxListIndented)}
              </div>
            );
          })}
        </div>
      )}

      {!visibleSeriesValues && visibleLabelKeys.length === 0 && (
        <span className={styles.noMatches}>
          <Trans i18nKey="grafana-ui.viz-legend.faceted-no-matches">No matching names or values</Trans>
        </span>
      )}
    </div>
  );
}

FacetedLabelsFilter.displayName = 'FacetedLabelsFilter';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    minWidth: '150px',
    padding: theme.spacing(1.5, 1, 1, 1),
    gap: theme.spacing(1),
  }),
  dimmed: css({
    opacity: 0.5,
  }),
  search: css({
    // keeps the input clear of the popover close button and the pinned sidebar actions
    paddingRight: theme.spacing(4),
  }),
  noMatches: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  section: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  sectionLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(0.25),
  }),
  toggleAll: css({
    all: 'unset',
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.link,
    marginTop: theme.spacing(0.25),
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  labelGroup: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  labelKey: css({
    all: 'unset',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    cursor: 'pointer',
    padding: theme.spacing(0.25, 0),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
    '&:hover': {
      color: theme.colors.text.maxContrast,
    },
  }),
  keyName: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
  count: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.primary.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  checkboxList: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.25),
    padding: theme.spacing(0, 0, 0.5, 0.5),
  }),
  checkboxListIndented: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.25),
    padding: theme.spacing(0, 0, 0.5, 2.5),
  }),
  checkbox: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
  }),
});
