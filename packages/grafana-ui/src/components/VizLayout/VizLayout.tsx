import { css } from '@emotion/css';
import { type FC, type CSSProperties, type ComponentType } from 'react';
import * as React from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { useStyles2 } from '../../themes/ThemeContext';
import { getFocusStyles } from '../../themes/mixins';
import { ScrollContainer } from '../ScrollContainer/ScrollContainer';

import { type VizLayoutLegendLayoutProps } from './types';
import { useVizLayoutLegend } from './useVizLayoutLegend';

/**
 * @beta
 */
export interface VizLayoutProps {
  width: number;
  height: number;
  /** A VizLayout.Legend, or a legend component that takes the same layout props */
  legend?: React.ReactElement<VizLayoutLegendLayoutProps> | null;
  children: (width: number, height: number) => React.ReactNode;
}

/**
 * @beta
 */
export interface VizLayoutComponentType extends FC<VizLayoutProps> {
  Legend: ComponentType<VizLayoutLegendProps>;
}

/**
 * @beta
 *
 * https://developers.grafana.com/ui/latest/index.html?path=/docs/plugins-vizlayout--docs
 */
export const VizLayout: VizLayoutComponentType = ({ width, height, legend, children }) => {
  const styles = useStyles2(getVizStyles);
  const { legendRef, layout } = useVizLayoutLegend(legend?.props, width, height);
  const containerStyle: CSSProperties = {
    display: 'flex',
    width: `${width}px`,
    height: `${height}px`,
  };

  if (!layout) {
    return (
      <>
        <div style={containerStyle} className={styles.viz} data-testid={selectors.components.VizLayout.container}>
          {children(width, height)}
        </div>
      </>
    );
  }

  const { placement, flexDirection, legendStyle, vizSize } = layout;

  return (
    <div style={{ ...containerStyle, flexDirection }} data-testid={selectors.components.VizLayout.container}>
      <div className={styles.viz}>{vizSize && children(vizSize.width, vizSize.height)}</div>
      <div style={legendStyle} ref={legendRef} data-testid={selectors.components.VizLayout.legend}>
        {/* a right-placed legend spans the full panel height, but the scroll container
            sizes to its content by default, so percentage heights inside the legend
            (e.g. a vertical color scale) would not resolve without an explicit height */}
        <ScrollContainer height={placement === 'right' ? '100%' : undefined}>{legend}</ScrollContainer>
      </div>
    </div>
  );
};

const getVizStyles = (theme: GrafanaTheme2) => {
  return {
    viz: css({
      flexGrow: 2,
      // without this, minWidth becomes `min-content`, which means the canvas will
      // never collapse down below its initial size. this means that the legend can never scale up in size
      minWidth: 0,
      borderRadius: theme.shape.radius.default,
      '&:focus-visible': getFocusStyles(theme),
    }),
  };
};

/**
 * @beta
 */
export interface VizLayoutLegendProps extends VizLayoutLegendLayoutProps {
  children: React.ReactNode;
}

/**
 * @beta
 */
export const VizLayoutLegend: FC<VizLayoutLegendProps> = ({ children }) => {
  return <>{children}</>;
};

VizLayout.Legend = VizLayoutLegend;
