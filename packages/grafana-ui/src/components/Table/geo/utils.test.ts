import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

import { createDataFrame, FieldType } from '@grafana/data';

import { isGeometry, hasGeoCell, formatGeoCellValue } from './utils';

describe('geo utils', () => {
  describe('isGeometry', () => {
    it('should return true for a valid Geometry object', () => {
      const mockGeometry = {
        intersectsCoordinate: () => true,
      };

      expect(isGeometry(mockGeometry)).toBe(true);
    });

    it('should return false for an object without intersectsCoordinate', () => {
      const invalidObject = {};

      expect(isGeometry(invalidObject)).toBe(false);
    });

    it('should return false for null or non-object values', () => {
      expect(isGeometry(null)).toBe(false);
      expect(isGeometry(42)).toBe(false);
      expect(isGeometry('not a geometry')).toBe(false);
    });
  });

  describe('hasGeoCell', () => {
    it('should return true if there is a geo field with a Geometry value', () => {
      const frame = createDataFrame({
        fields: [
          {
            type: FieldType.geo,
            values: [new Point(fromLonLat([0, 0]))],
          },
        ],
      });
      expect(hasGeoCell(frame)).toBe(true);
    });

    it('should return false if there are no geo fields', () => {
      const frame = createDataFrame({
        fields: [
          {
            type: FieldType.string,
            values: ['not geo'],
          },
        ],
      });
      expect(hasGeoCell(frame)).toBe(false);
    });

    it('should return false if geo fields do not contain Geometry values', () => {
      const frame = createDataFrame({
        fields: [
          {
            type: FieldType.geo,
            values: [null, {}],
          },
        ],
      });
      expect(hasGeoCell(frame)).toBe(false);
    });
  });

  describe('formatGeoCellValue', () => {
    const formatGeometry = () => 'POINT (0 0)';

    it('should format Geometry values with the given formatter', () => {
      expect(formatGeoCellValue(new Point(fromLonLat([0, 0])), formatGeometry)).toBe('POINT (0 0)');
    });

    it('should return other values as strings', () => {
      expect(formatGeoCellValue(42, formatGeometry)).toBe('42');
      expect(formatGeoCellValue('not a geometry')).toBe('not a geometry');
    });

    it('should return null for empty values', () => {
      expect(formatGeoCellValue(null, formatGeometry)).toBeNull();
      expect(formatGeoCellValue(undefined)).toBeNull();
    });
  });
});
