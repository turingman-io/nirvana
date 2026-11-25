import { css } from '@emotion/css';

import { type GrafanaTheme2, type LoadingState } from '@grafana/data';
import { t } from '@grafana/i18n';
import { PanelChrome, useStyles2 } from '@grafana/ui';

import { MetaInfoText } from '../MetaInfoText';

interface Props {
  width: number;
  loadingState?: LoadingState;
}

export function TableNoDataPanel({ width, loadingState }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <PanelChrome
      title={t('explore.table.title', 'Table')}
      width={width}
      height={200}
      loadingState={loadingState}
      // Renders MetaInfoText, not the table panel — don't inherit its noPadding.
      padding="md"
    >
      {() => (
        // Matches the title's extra inline-start padding (PANEL_TITLE_INSET in Table/TableNG/constants.ts).
        <div className={styles.message}>
          <MetaInfoText metaItems={[{ value: t('explore.table.no-data', '0 series returned') }]} />
        </div>
      )}
    </PanelChrome>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  message: css({
    paddingInlineStart: theme.spacing.x0_5,
  }),
});
