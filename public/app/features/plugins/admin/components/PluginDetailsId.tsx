import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { ClipboardButton, useStyles2 } from '@grafana/ui';

type Props = {
  pluginId: string;
};

// The plugin ID is what provisioning files, the CLI and dashboard JSON refer to, so it can be copied from here
export function PluginDetailsId({ pluginId }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <code data-testid="plugin-details-id">{pluginId}</code>
      <ClipboardButton
        aria-label={t('plugins.details.copy-plugin-id', 'Copy plugin ID')}
        variant="secondary"
        fill="text"
        size="sm"
        icon="copy"
        getText={() => pluginId}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    }),
  };
};
