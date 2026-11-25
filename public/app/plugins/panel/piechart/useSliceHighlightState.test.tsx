import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';

import { DataHoverClearEvent, DataHoverEvent, EventBusSrv } from '@grafana/data';
import { PanelContextProvider } from '@grafana/ui';

import { useSliceHighlightState } from './useSliceHighlightState';

describe('useSliceHighlightState', () => {
  it('follows the hovered slice published on the panel event bus', () => {
    const eventBus = new EventBusSrv();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PanelContextProvider value={{ eventsScope: 'test', eventBus }}>{children}</PanelContextProvider>
    );

    const { result } = renderHook(() => useSliceHighlightState(), { wrapper });
    expect(result.current).toBeUndefined();

    act(() => {
      eventBus.publish(new DataHoverEvent({ point: {}, dataId: 'Chrome' }));
    });
    expect(result.current).toBe('Chrome');

    act(() => {
      eventBus.publish(new DataHoverClearEvent());
    });
    expect(result.current).toBeUndefined();
  });
});
