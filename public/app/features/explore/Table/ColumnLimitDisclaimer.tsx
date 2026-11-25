import { Trans, t } from '@grafana/i18n';

import { LimitedDataDisclaimer } from '../LimitedDataDisclaimer';

import { MAX_NUMBER_OF_COLUMNS } from './utils';

interface Props {
  onShowAllColumns: () => void;
}

export function ColumnLimitDisclaimer({ onShowAllColumns }: Props) {
  return (
    <LimitedDataDisclaimer
      toggleShowAllSeries={onShowAllColumns}
      info={
        <Trans i18nKey={'table.container.show-only-series'}>Showing only {{ MAX_NUMBER_OF_COLUMNS }} columns</Trans>
      }
      tooltip={t(
        'table.container.content',
        'Showing too many columns in a single table may impact performance and make data harder to read. Consider refining your queries.'
      )}
      buttonLabel={<Trans i18nKey={'table.container.show-all-series'}>Show all columns</Trans>}
    />
  );
}
