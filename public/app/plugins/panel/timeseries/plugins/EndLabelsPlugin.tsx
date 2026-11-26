import { css } from '@emotion/css';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import uPlot from 'uplot';

import { type DataFrame, formattedValueToString, type GrafanaTheme2 } from '@grafana/data';
import { Marker, type UPlotConfigBuilder, useStyles2, XYCanvas } from '@grafana/ui';

import { EndLabelsMode } from '../panelcfg.gen';

const LABEL_HEIGHT = 16;
const LABEL_OFFSET = 4;

export interface EndLabel {
  key: string;
  text: string;
  color?: string;
  x: number;
  y: number;
}

/**
 * One label per visible series, anchored to its last non-null point within the x range.
 * Labels are stacked so they don't overlap when several series end at a similar value.
 */
export function getEndLabels(u: uPlot, frame: DataFrame, mode: EndLabelsMode): EndLabel[] {
  const labels: EndLabel[] = [];
  const xValues = u.data[0];
  const xMax = u.scales.x.max ?? Infinity;

  for (let seriesIdx = 1; seriesIdx < u.series.length; seriesIdx++) {
    const series = u.series[seriesIdx];
    const field = frame.fields[seriesIdx];

    if (!series.show || !field || series.scale == null) {
      continue;
    }

    const yValues = u.data[seriesIdx];
    let idx = xValues.length - 1;

    while (idx >= 0 && (xValues[idx] > xMax || yValues[idx] == null)) {
      idx--;
    }

    if (idx < 0) {
      continue;
    }

    const x = u.valToPos(xValues[idx], 'x');
    const y = u.valToPos(yValues[idx]!, series.scale);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    // u.data holds stacked values, the label shows the field's own value
    const display = field.display?.(field.values[idx]);
    const name = field.state?.displayName ?? field.name;

    labels.push({
      key: `${seriesIdx}`,
      text: mode === EndLabelsMode.Value && display ? formattedValueToString(display) : name,
      color: display?.color,
      x,
      y: Math.max(y - LABEL_OFFSET, LABEL_HEIGHT),
    });
  }

  labels.sort((a, b) => a.y - b.y);

  for (let i = 1; i < labels.length; i++) {
    labels[i].y = Math.max(labels[i].y, labels[i - 1].y + LABEL_HEIGHT);
  }

  return labels;
}

interface EndLabelsPluginProps {
  config: UPlotConfigBuilder;
  frame: DataFrame;
  mode: EndLabelsMode;
}

export const EndLabelsPlugin = ({ config, frame, mode }: EndLabelsPluginProps) => {
  const styles = useStyles2(getStyles);
  const [initialized, setInitialized] = useState<{ config: UPlotConfigBuilder; plot: uPlot }>();
  const [, setDrawCount] = useState(0);

  useLayoutEffect(() => {
    let mounted = true;

    config.addHook('init', (plot) => {
      if (mounted) {
        setInitialized({ config, plot });
      }
    });

    // label positions depend on the scales and the plot size, so follow every redraw
    config.addHook('draw', () => {
      if (mounted) {
        setDrawCount((count) => count + 1);
      }
    });

    return () => {
      mounted = false;
    };
  }, [config]);

  const plot = initialized?.config === config ? initialized.plot : undefined;

  if (!plot) {
    return null;
  }

  const labels = getEndLabels(plot, frame, mode);

  // below the canvas, so the series and the cursor stay on top of the labels
  return createPortal(
    <XYCanvas left={plot.bbox.left / uPlot.pxRatio} top={plot.bbox.top / uPlot.pxRatio}>
      {labels.map((label) => (
        <Marker key={label.key} x={label.x} y={label.y}>
          <div className={styles.label} style={{ color: label.color }}>
            {label.text}
          </div>
        </Marker>
      ))}
    </XYCanvas>,
    plot.under
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  label: css({
    transform: 'translate(-100%, -100%)',
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: `${LABEL_HEIGHT}px`,
    whiteSpace: 'nowrap',
  }),
});
