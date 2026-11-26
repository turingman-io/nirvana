import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FIELD_NAME_FACET_KEY } from '@grafana/data';

import { FacetedLabelsFilter, type FacetedLabelsFilterProps } from './FacetedLabelsFilter';

function renderFilter(overrides: Partial<FacetedLabelsFilterProps> = {}) {
  const props: FacetedLabelsFilterProps = {
    labels: {
      [FIELD_NAME_FACET_KEY]: ['cpu', 'mem'],
      host: ['a', 'b'],
      region: ['eu', 'us'],
    },
    selected: {},
    onChange: jest.fn(),
    ...overrides,
  };

  return { ...render(<FacetedLabelsFilter {...props} />), onChange: props.onChange as jest.Mock };
}

describe('FacetedLabelsFilter', () => {
  it('returns null when labels are empty', () => {
    const { container } = renderFilter({ labels: {} });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sections based on available facets', () => {
    const { unmount } = renderFilter();
    expect(screen.getByText('By name')).toBeInTheDocument();
    expect(screen.getByText('By labels')).toBeInTheDocument();
    unmount();

    const { unmount: u2 } = renderFilter({ labels: { host: ['a'] } });
    expect(screen.queryByText('By name')).not.toBeInTheDocument();
    u2();

    renderFilter({ labels: { [FIELD_NAME_FACET_KEY]: ['cpu'] } });
    expect(screen.queryByText('By labels')).not.toBeInTheDocument();
  });

  it('toggles checkbox values and shows deselect when all selected', async () => {
    const { onChange, unmount } = renderFilter();
    await userEvent.click(screen.getByLabelText('cpu'));
    expect(onChange).toHaveBeenCalledWith({ [FIELD_NAME_FACET_KEY]: ['cpu'] });
    unmount();

    const { onChange: onChange2 } = renderFilter({ selected: { [FIELD_NAME_FACET_KEY]: ['cpu', 'mem'] } });
    expect(screen.getByText('Deselect all')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('cpu'));
    expect(onChange2).toHaveBeenCalledWith({ [FIELD_NAME_FACET_KEY]: ['mem'] });
  });

  it('expands/collapses label groups and toggles values within them', async () => {
    const { onChange } = renderFilter();
    expect(screen.queryByLabelText('a')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('host'));
    expect(screen.getByLabelText('a')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('a'));
    expect(onChange).toHaveBeenCalledWith({ host: ['a'] });

    await userEvent.click(screen.getByText('host'));
    expect(screen.queryByLabelText('a')).not.toBeInTheDocument();
  });

  it('shows selected count badge on collapsed label groups', () => {
    renderFilter({ selected: { host: ['a'] } });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('select all / deselect all toggles all values for a key', async () => {
    const { onChange, unmount } = renderFilter();
    await userEvent.click(screen.getByText('Select all', { selector: 'button' }));
    expect(onChange).toHaveBeenCalledWith({ [FIELD_NAME_FACET_KEY]: ['cpu', 'mem'] });
    unmount();

    const { onChange: onChange2 } = renderFilter({
      selected: { [FIELD_NAME_FACET_KEY]: ['cpu', 'mem'] },
    });
    await userEvent.click(screen.getByText('Deselect all', { selector: 'button' }));
    expect(onChange2).toHaveBeenCalledWith({ [FIELD_NAME_FACET_KEY]: [] });
  });

  it('applies dimmed style when dimmed prop is true', () => {
    const { container: dimmed } = renderFilter({ dimmed: true });
    const { container: normal } = renderFilter({ dimmed: false });
    expect((dimmed.firstChild as HTMLElement).className).not.toBe((normal.firstChild as HTMLElement).className);
  });

  describe('search', () => {
    const getSearchInput = () => screen.getByPlaceholderText('Search');

    it('narrows names and label values to the ones that match', async () => {
      renderFilter();
      await userEvent.type(getSearchInput(), 'mem');

      expect(screen.getByLabelText('mem')).toBeInTheDocument();
      expect(screen.queryByLabelText('cpu')).not.toBeInTheDocument();
      expect(screen.queryByText('By labels')).not.toBeInTheDocument();

      await userEvent.clear(getSearchInput());
      expect(screen.getByLabelText('cpu')).toBeInTheDocument();
      expect(screen.getByText('By labels')).toBeInTheDocument();
    });

    it('opens label groups that have matching values', async () => {
      renderFilter();
      await userEvent.type(getSearchInput(), 'EU');

      expect(screen.getByLabelText('eu')).toBeInTheDocument();
      expect(screen.queryByLabelText('us')).not.toBeInTheDocument();
      expect(screen.queryByText('host')).not.toBeInTheDocument();
      expect(screen.queryByText('By name')).not.toBeInTheDocument();
    });

    it('accepts regular expressions with RE2-style flags', async () => {
      renderFilter();

      await userEvent.type(getSearchInput(), '^c.u$');
      expect(screen.getByLabelText('cpu')).toBeInTheDocument();
      expect(screen.queryByLabelText('mem')).not.toBeInTheDocument();

      await userEvent.clear(getSearchInput());
      await userEvent.type(getSearchInput(), '(?-i)CPU');
      expect(screen.getByText('No matching names or values')).toBeInTheDocument();
    });

    it('matches a search that is not a valid regular expression as plain text', async () => {
      renderFilter({ labels: { [FIELD_NAME_FACET_KEY]: ['cpu (avg)', 'mem'] } });
      await userEvent.type(getSearchInput(), 'cpu (');

      expect(screen.getByLabelText('cpu (avg)')).toBeInTheDocument();
      expect(screen.queryByLabelText('mem')).not.toBeInTheDocument();
    });

    it('only adds the matching values with select all', async () => {
      const { onChange } = renderFilter({ selected: { [FIELD_NAME_FACET_KEY]: ['cpu'] } });
      await userEvent.type(getSearchInput(), 'mem');
      await userEvent.click(screen.getByText('Select all', { selector: 'button' }));

      expect(onChange).toHaveBeenCalledWith({ [FIELD_NAME_FACET_KEY]: ['cpu', 'mem'] });
    });
  });
});
