import { css } from '@emotion/css';
import { memo, useState } from 'react';
import { connect, type ConnectedProps } from 'react-redux';
import { useAsync } from 'react-use';

import { type SplitOpen, LoadingState, type EventBus, type GrafanaTheme2 } from '@grafana/data';
import { type TimeZone } from '@grafana/schema';
import { type AdHocFilterItem, useStyles2 } from '@grafana/ui';
import { importPanelPlugin } from 'app/features/plugins/importPanelPlugin';
import { type ExploreItemState } from 'app/types/explore';
import { type StoreState } from 'app/types/store';

import { useExploreDataLinkPostProcessor } from '../hooks/useExploreDataLinkPostProcessor';
import { selectIsWaitingForData } from '../state/query';

import { ColumnLimitDisclaimer } from './ColumnLimitDisclaimer';
import { TableFramePanel } from './TableFramePanel';
import { TableNoDataPanel } from './TableNoDataPanel';
import { useTableFrames } from './useTableFrames';
import { getNonEmptyFrames, getTableTitle } from './utils';

const TEMPO_STREAMING_PROGRESS_REF_ID = 'streaming-progress';

interface TableContainerProps {
  exploreId: string;
  width: number;
  timeZone: TimeZone;
  onCellFilterAdded?: (filter: AdHocFilterItem) => void;
  splitOpenFn: SplitOpen;
  eventBus?: EventBus;
  ariaLabel?: string;
}

export function mapStateToProps(state: StoreState, { exploreId }: TableContainerProps) {
  const explore = state.explore;
  const item: ExploreItemState = explore.panes[exploreId]!;
  const { tableResult, range } = item;
  const loading = selectIsWaitingForData(exploreId)(state);
  const hasTempoStreamingProgressTable = tableResult?.some((f) => f.refId === TEMPO_STREAMING_PROGRESS_REF_ID);
  return {
    // PanelChrome renders a loading bar for Loading and a streaming indicator for Streaming. Mirror the
    // query state only while a query is in flight, so neither indicator can outlive the query. Reading
    // the state directly keeps a leftover Tempo streaming-progress frame from picking the indicator.
    panelLoadingState: loading ? item.queryResponse.state : undefined,
    tableResult,
    range,
    queryStreaming: item.queryResponse.state === LoadingState.Streaming || Boolean(hasTempoStreamingProgressTable),
  };
}

const connector = connect(mapStateToProps, {});
type Props = TableContainerProps & ConnectedProps<typeof connector>;

export const TableContainer = memo(function TableContainer({
  panelLoadingState,
  onCellFilterAdded,
  tableResult,
  width,
  splitOpenFn,
  range,
  timeZone,
  eventBus,
  queryStreaming = false,
}: Props) {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);
  const tablePlugin = useAsync(() => importPanelPlugin('table'), []);
  const panelPadding = tablePlugin.value?.noPadding ? 'none' : 'md';

  const dataLinkPostProcessor = useExploreDataLinkPostProcessor(splitOpenFn, range);
  const { frames: dataFrames, dataLimited } = useTableFrames({
    tableResult,
    showAllColumns: showAll,
    timeZone,
    dataLinkPostProcessor,
  });

  const frames = getNonEmptyFrames(dataFrames);

  return (
    <>
      {frames && frames.length === 0 && <TableNoDataPanel width={width} loadingState={panelLoadingState} />}
      {frames && frames.length > 0 && (
        <div className={styles.tables}>
          {frames.map((data, i) => (
            <TableFramePanel
              key={`${data.refId || `table-${i}`}-${panelPadding}`}
              frame={data}
              title={getTableTitle(dataFrames, data, i)}
              titleItems={[
                !showAll && dataLimited && (
                  <ColumnLimitDisclaimer key="disclaimer" onShowAllColumns={() => setShowAll(true)} />
                ),
              ]}
              width={width}
              padding={panelPadding}
              loadingState={panelLoadingState}
              queryStreaming={queryStreaming}
              range={range}
              timeZone={timeZone}
              dataLinkPostProcessor={dataLinkPostProcessor}
              eventBus={eventBus}
              onCellFilterAdded={onCellFilterAdded}
            />
          ))}
        </div>
      )}
    </>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  tables: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
});

export default connector(TableContainer);
