import { type DataFrame, type GrafanaTheme2 } from '@grafana/data';
import { type HideableFieldConfig, type TimelineValueAlignment, type VisibilityMode } from '@grafana/schema';

export enum TimelineMode {
  Changes = 'changes',
  Samples = 'samples',
}

/**
 * @internal
 */
export interface UPlotConfigOptions {
  frame: DataFrame;
  theme: GrafanaTheme2;
  mode: TimelineMode;
  rowHeight?: number;
  colWidth?: number;
  showValue: VisibilityMode;
  alignValue?: TimelineValueAlignment;
  mergeValues?: boolean;
  getValueColor: (frameIdx: number, fieldIdx: number, value: unknown) => string;
  hoverMulti: boolean;
  axisWidth?: number;
}

/**
 * @internal
 */
export interface PanelFieldConfig extends HideableFieldConfig {
  fillOpacity?: number;
  lineWidth?: number;
}
