import { type ReactNode } from 'react';

import {
  type DataFrame,
  type DataLinkPostProcessor,
  DataLinksContext,
  type EventBus,
  EventBusSrv,
  LoadingState,
  type TimeRange,
} from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { type TimeZone } from '@grafana/schema';
import { type AdHocFilterItem, PanelChrome, PanelContextProvider, type PanelPadding } from '@grafana/ui';

import { getTableHeight, hasSubFrames } from './utils';

interface Props {
  frame: DataFrame;
  title: string;
  titleItems?: ReactNode;
  width: number;
  padding: PanelPadding;
  loadingState?: LoadingState;
  queryStreaming: boolean;
  range: TimeRange;
  timeZone: TimeZone;
  dataLinkPostProcessor: DataLinkPostProcessor;
  eventBus?: EventBus;
  onCellFilterAdded?: (filter: AdHocFilterItem) => void;
}

/**
 * Renders a single frame of Explore's table result with the table panel plugin.
 */
export function TableFramePanel({
  frame,
  title,
  titleItems,
  width,
  padding,
  loadingState,
  queryStreaming,
  range,
  timeZone,
  dataLinkPostProcessor,
  eventBus,
  onCellFilterAdded,
}: Props) {
  return (
    <PanelChrome
      title={title}
      titleItems={titleItems}
      width={width}
      height={getTableHeight(frame.length, hasSubFrames(frame), queryStreaming)}
      loadingState={loadingState}
      padding={padding}
    >
      {(innerWidth, innerHeight) => (
        <DataLinksContext.Provider value={{ dataLinkPostProcessor }}>
          <PanelContextProvider
            value={{
              eventsScope: 'explore',
              eventBus: eventBus ?? new EventBusSrv(),
              onAddAdHocFilter: onCellFilterAdded,
            }}
          >
            <PanelRenderer
              data={{
                series: [frame],
                state: loadingState ?? LoadingState.Done,
                timeRange: range,
              }}
              pluginId={'table'}
              title=""
              width={innerWidth}
              height={innerHeight}
              timeZone={timeZone}
            />
          </PanelContextProvider>
        </DataLinksContext.Provider>
      )}
    </PanelChrome>
  );
}
