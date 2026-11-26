import { render, screen } from '@testing-library/react';

import { createTheme } from '@grafana/data';

import { BigValue } from './BigValue';
import { BigValueColorMode, BigValueGraphMode, BigValueTextMode, type Props } from './BigValueTypes';

const valueObject = {
  text: '25',
  numeric: 25,
  color: 'red',
};

function getProps(propOverrides?: Partial<Props>): Props {
  const props: Props = {
    colorMode: BigValueColorMode.Background,
    graphMode: BigValueGraphMode.Line,
    height: 300,
    width: 300,
    value: valueObject,
    theme: createTheme(),
  };

  Object.assign(props, propOverrides);
  return props;
}

describe('BigValue', () => {
  describe('Render with basic options', () => {
    it('should render', () => {
      render(<BigValue {...getProps()} />);

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should render with percent change', () => {
      render(
        <BigValue
          {...getProps({
            value: { ...valueObject, percentChange: 0.5 },
          })}
        />
      );

      expect(screen.getByText('0.5%')).toBeInTheDocument();
    });

    it('should render without percent change', () => {
      render(<BigValue {...getProps()} />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('should render the caption under the value', () => {
      render(<BigValue {...getProps({ caption: 'Last updated 2024-01-01 10:00:00' })} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Last updated 2024-01-01 10:00:00')).toBeInTheDocument();
    });

    it('should render the caption when the value is clickable', () => {
      render(<BigValue {...getProps({ caption: 'Last updated 2024-01-01 10:00:00', onClick: jest.fn() })} />);

      expect(screen.getByRole('button')).toHaveTextContent('Last updated 2024-01-01 10:00:00');
    });

    it('should not render the caption when text mode is none', () => {
      render(
        <BigValue {...getProps({ caption: 'Last updated 2024-01-01 10:00:00', textMode: BigValueTextMode.None })} />
      );

      expect(screen.queryByText('Last updated 2024-01-01 10:00:00')).not.toBeInTheDocument();
    });
  });
});
