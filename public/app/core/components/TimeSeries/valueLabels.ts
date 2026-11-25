import uPlot from 'uplot';

import { type DataFrame, type Field, formattedValueToString, type GrafanaTheme2 } from '@grafana/data';
import { GraphDrawStyle, VisibilityMode } from '@grafana/schema';
import { type UPlotConfigBuilder } from '@grafana/ui/internal';

/**
 * Draws the values of the fields that have "Show values" enabled above their points or bars
 * (below them, for negative values).
 */
export function addValueLabels(builder: UPlotConfigBuilder, frame: DataFrame, theme: GrafanaTheme2) {
  if (!mightShowValues(frame)) {
    return;
  }

  builder.addHook('draw', (u: uPlot) => {
    const baseFontSize = 12;
    const font = `${baseFontSize * uPlot.pxRatio}px ${theme.typography.fontFamily}`;

    const { ctx } = u;

    ctx.save();
    ctx.fillStyle = theme.colors.text.primary;
    ctx.font = font;
    ctx.textAlign = 'center';

    for (let seriesIdx = 1; seriesIdx < u.data.length; seriesIdx++) {
      const field = frame.fields[seriesIdx];

      if (seriesShowsValues(u, seriesIdx, field)) {
        drawSeriesValues(u, seriesIdx, field);
      }
    }

    ctx.restore();
  });
}

function mightShowValues(frame: DataFrame): boolean {
  return frame.fields.some((field, i) => {
    if (i === 0) {
      return false;
    }

    const customConfig = field.config.custom ?? {};

    return (
      customConfig.showValues &&
      (customConfig.drawStyle === GraphDrawStyle.Points || customConfig.showPoints !== VisibilityMode.Never)
    );
  });
}

function seriesShowsValues(u: uPlot, seriesIdx: number, field: Field): boolean {
  const series = u.series[seriesIdx];

  if (!field.config.custom?.showValues) {
    return false;
  }

  // @ts-ignore points.show() is always callable on the instance (but may be boolean when passed to uPlot as init option)
  if (series.points?.show?.(u, seriesIdx)) {
    return true;
  }

  // since bars style doesnt show points in Auto mode, we can't piggyback on series.points.show()
  // so we use a simple density-based check for them
  return field.config.custom.drawStyle === GraphDrawStyle.Bars && barsShowValues(u);
}

function barsShowValues(u: uPlot): boolean {
  let width = u.bbox.width / uPlot.pxRatio;
  let count = u.data[0].length;

  // render values when each has at least 30px of width available
  return width / count >= 30;
}

function drawSeriesValues(u: uPlot, seriesIdx: number, field: Field) {
  const { ctx } = u;
  const xData = u.data[0];
  const yData = u.data[seriesIdx];
  const yScale = u.series[seriesIdx].scale!;

  for (let dataIdx = 0; dataIdx < yData.length; dataIdx++) {
    const yVal = yData[dataIdx];

    if (yVal != null) {
      const text = formattedValueToString(field.display!(yVal));

      const isNegative = yVal < 0;
      const textOffset = isNegative ? 15 : -5;
      ctx.textBaseline = isNegative ? 'top' : 'bottom';

      const xVal = xData[dataIdx];
      const x = u.valToPos(xVal, 'x', true);
      const y = u.valToPos(yVal, yScale, true);

      ctx.fillText(text, x, y + textOffset);
    }
  }
}
