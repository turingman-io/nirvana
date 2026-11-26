import { dateMath, rangeUtil } from '@grafana/data';
import { type FormatVariable, sceneGraph, type SceneObject } from '@grafana/scenes';

/**
 * Handles ${__time_range}: the time range in effect for the scene object, described the way the time picker
 * shows it, e.g. "Last 6 hours" or "2024-01-01 00:00:00 to 2024-01-02 00:00:00".
 */
export class TimeRangeMacro implements FormatVariable {
  public state: { name: string; type: string };

  public constructor(
    name: string,
    private _sceneObject: SceneObject
  ) {
    this.state = { name, type: 'time_macro' };
  }

  public getValue(): string {
    const timeRange = sceneGraph.getTimeRange(this._sceneObject);
    const { value } = timeRange.state;

    // Keep relative ranges as written so they read like the picker ("Last 6 hours"), and format absolute ones
    const range = {
      from: dateMath.isMathString(value.raw.from) ? value.raw.from : value.from,
      to: dateMath.isMathString(value.raw.to) ? value.raw.to : value.to,
    };

    return rangeUtil.describeTimeRange(range, timeRange.getTimeZone());
  }

  public getValueText(): string {
    return this.getValue();
  }
}
