import { lazy } from 'react';

export { formatGeoCellValue, hasGeoCell, isGeometry } from './utils';
export { type OpenLayersContextValue, useOpenLayersContext } from './OpenLayersContext';

export const LazyOpenLayersProvider = lazy(() =>
  import('./OpenLayersProvider').then((module) => ({ default: module.OpenLayersProvider }))
);
