import { css, cx, keyframes } from '@emotion/css';
import { type ReactNode } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

interface Props {
  /**
   * Ease the content in when it mounts. Rows unmount their content while collapsed, so mounting is
   * what expanding a row looks like. Off for rows that are already expanded when the dashboard loads.
   */
  animate: boolean;
  className?: string;
  id?: string;
  children: ReactNode;
}

/**
 * Holds a row's content so that expanding the row opens it with a short height and fade transition,
 * instead of pushing everything below it down in a single jump.
 */
export function RowLayoutReveal({ animate, className, id, children }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.track, animate && styles.trackAnimated)}>
      <div className={cx(styles.content, className)} id={id}>
        {children}
      </div>
    </div>
  );
}

const reveal = keyframes({
  from: { gridTemplateRows: '0fr', opacity: 0 },
  to: { gridTemplateRows: '1fr', opacity: 1 },
});

const getStyles = (theme: GrafanaTheme2) => ({
  // Animating grid rows from 0fr to 1fr opens the content without measuring its height.
  track: css({
    display: 'grid',
    gridTemplateRows: '1fr',
    flex: 1,
    minHeight: 0,
  }),
  trackAnimated: css({
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${reveal} ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeOut}`,
    },
  }),
  content: css({
    minHeight: 0,
    overflow: 'hidden',
  }),
});
