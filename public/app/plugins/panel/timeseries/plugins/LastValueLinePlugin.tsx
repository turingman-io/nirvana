import { css } from '@emotion/css';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import uPlot from 'uplot';

import { type DataFrame, formattedValueToString, type GrafanaTheme2 } from '@grafana/data';
import { Marker, type UPlotConfigBuilder, useStyles2, useTheme2, XYCanvas } from '@grafana/ui';

const TAG_HEIGHT = 18;
const TAG_OFFSET = 2;

export interface LastValueLine {
  key: string;
  text: string;
  color: string;
  y: number;
  /** bottom edge of the value tag */
  tagY: number;
}

/**
 * The last non-null value of each visible series within the x range. The value tag sits just above
 * the line, and tags of series that end close together are stacked so they don't overlap.
 */
export function getLastValueLines(u: uPlot, frame: DataFrame, theme: GrafanaTheme2): LastValueLine[] {
  const lines: LastValueLine[] = [];
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

    const y = u.valToPos(yValues[idx]!, series.scale);

    if (!Number.isFinite(y)) {
      continue;
    }

    // u.data holds stacked values, the tag shows the field's own value
    const display = field.display?.(field.values[idx]);

    lines.push({
      key: `${seriesIdx}`,
      text: display ? formattedValueToString(display) : String(field.values[idx]),
      color: display?.color ?? theme.colors.text.primary,
      y,
      tagY: Math.max(y - TAG_OFFSET, TAG_HEIGHT),
    });
  }

  lines.sort((a, b) => a.tagY - b.tagY);

  for (let i = 1; i < lines.length; i++) {
    lines[i].tagY = Math.max(lines[i].tagY, lines[i - 1].tagY + TAG_HEIGHT);
  }

  return lines;
}

interface LastValueLinePluginProps {
  config: UPlotConfigBuilder;
  frame: DataFrame;
}

export const LastValueLinePlugin = ({ config, frame }: LastValueLinePluginProps) => {
  const theme = useTheme2();
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

  const width = plot.bbox.width / uPlot.pxRatio;
  const lines = getLastValueLines(plot, frame, theme);

  return createPortal(
    <XYCanvas left={plot.bbox.left / uPlot.pxRatio} top={plot.bbox.top / uPlot.pxRatio}>
      {lines.map((line) => (
        <Marker key={`line-${line.key}`} x={0} y={line.y}>
          <div className={styles.line} style={{ width, borderColor: line.color }} />
        </Marker>
      ))}
      {lines.map((line) => (
        <Marker key={`tag-${line.key}`} x={width} y={line.tagY}>
          <div
            className={styles.tag}
            style={{ background: line.color, color: theme.colors.getContrastText(line.color) }}
          >
            {line.text}
          </div>
        </Marker>
      ))}
    </XYCanvas>,
    plot.under
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  line: css({
    borderTop: '1px dashed',
    opacity: 0.8,
  }),
  tag: css({
    transform: 'translate(-100%, -100%)',
    height: TAG_HEIGHT,
    padding: theme.spacing(0, 0.75),
    borderRadius: theme.shape.radius.default,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: `${TAG_HEIGHT}px`,
    whiteSpace: 'nowrap',
  }),
});
