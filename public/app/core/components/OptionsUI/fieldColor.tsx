import { css, cx } from '@emotion/css';
import { memoize } from 'lodash';
import { type FC, type FormEvent } from 'react';

import {
  type StandardEditorProps,
  FieldColorModeId,
  type SelectableValue,
  type FieldColor,
  fieldColorModeRegistry,
  type FieldColorMode,
  type GrafanaTheme2,
  type FieldColorConfigSettings,
  type FieldColorSeriesByMode,
  getFieldColorMode,
  isReversibleFieldColorMode,
} from '@grafana/data';
import { t } from '@grafana/i18n';
import {
  useFlagDatavizExperimentalColorSchemes,
  useFlagDatavizReverseColorScheme,
  useFlagEnableColorblindSafePanelOptions,
  useFlagPieChartGradientColorScheme,
} from '@grafana/runtime/internal';
import { useStyles2, useTheme2, Field, RadioButtonGroup, Select, Stack, Switch } from '@grafana/ui';

import { ColorValueEditor } from './color';
import { getColorSchemeBackground } from './colorSchemePreview';

const GRADIENT_DEFAULT_FROM = '#73BF69';
const GRADIENT_DEFAULT_TO = '#F2495C';

const getPreviewBackground = memoize(getColorSchemeBackground);

type Props = StandardEditorProps<FieldColor | undefined, FieldColorConfigSettings>;

export const FieldColorEditor = ({ value, onChange, item, id }: Props) => {
  const colorblindSafePanelOptions = useFlagEnableColorblindSafePanelOptions();
  const pieChartGradientColorScheme = useFlagPieChartGradientColorScheme();
  const experimentalColorSchemesEnabled = useFlagDatavizExperimentalColorSchemes();
  const reverseColorSchemeEnabled = useFlagDatavizReverseColorScheme();
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const colorMode = getFieldColorMode(value?.mode);
  const canReverse = reverseColorSchemeEnabled && isReversibleFieldColorMode(colorMode);
  const reverse = canReverse && Boolean(value?.reverse);
  const schemePreview = (
    <FieldColorModeViz
      mode={reverse ? getFieldColorMode(value?.mode, true) : colorMode}
      theme={theme}
      className={styles.schemePreview}
      label={t('options-ui.field-color.scheme-preview', 'Color scheme preview')}
    />
  );
  const availableOptions = item.settings?.byValueSupport
    ? fieldColorModeRegistry.list()
    : fieldColorModeRegistry.list().filter((m) => !m.isByValue);

  const experimentalColorSchemeModes: string[] = [
    FieldColorModeId.PaletteCategoricalNext,
    FieldColorModeId.PaletteCategoricalNext2,
    FieldColorModeId.PaletteCategoricalNext3,
  ];

  const filteredOptions = availableOptions.filter(
    (option) =>
      !option.excludeFromPicker &&
      (option.id !== FieldColorModeId.PaletteColorblind || colorblindSafePanelOptions) &&
      (!experimentalColorSchemeModes.includes(option.id) || experimentalColorSchemesEnabled) &&
      (option.id !== FieldColorModeId.Gradient || (item.settings?.gradientSupport && pieChartGradientColorScheme))
  );

  const options: Array<SelectableValue<string>> = [];
  // collect any grouped options in this map
  // this allows us to easily push to the child array without having to rescan the options array
  // it also allows us to maintain group position in the order they're first encountered
  const groupMap = new Map<string, Array<SelectableValue<string>>>();

  for (const option of filteredOptions) {
    const suffix = option.isByValue ? ' (by value)' : '';

    const groupName = option.group;
    const selectOption = {
      value: option.id,
      label: `${option.name}${suffix}`,
      description: option.description,
      component() {
        return <FieldColorModeViz mode={reverse ? getFieldColorMode(option.id, true) : option} theme={theme} />;
      },
    };

    if (groupName) {
      let group = groupMap.get(groupName);
      if (!group) {
        group = [];
        groupMap.set(groupName, group);
        options.push({ label: groupName, options: group });
      }
      group.push(selectOption);
    } else {
      options.push(selectOption);
    }
  }

  const onModeChange = (newMode: SelectableValue<string>) => {
    const update: FieldColor = { ...value, mode: newMode.value! };
    // Seed gradient defaults so the pickers are never empty when first selected.
    if (newMode.value === FieldColorModeId.Gradient) {
      update.fixedColor = value?.fixedColor ?? GRADIENT_DEFAULT_FROM;
      update.gradientColorTo = value?.gradientColorTo ?? GRADIENT_DEFAULT_TO;
    }
    onChange(update);
  };

  const onColorChange = (color?: string) => {
    onChange({
      ...value,
      mode,
      fixedColor: color,
    });
  };

  const onGradientColorToChange = (color?: string) => {
    onChange({
      ...value,
      mode,
      gradientColorTo: color,
    });
  };

  const onSeriesModeChange = (seriesBy?: FieldColorSeriesByMode) => {
    onChange({
      ...value,
      mode,
      seriesBy,
    });
  };

  const mode = value?.mode ?? FieldColorModeId.Thresholds;

  const onReverseChange = (event: FormEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      mode,
      reverse: event.currentTarget.checked || undefined,
    });
  };

  const reverseSwitch = canReverse && (
    <Field label={t('options-ui.field-color.reverse-label', 'Reverse colors')} noMargin>
      <Switch id={`${id}-reverse`} value={reverse} onChange={onReverseChange} />
    </Field>
  );

  if (mode === FieldColorModeId.Fixed || mode === FieldColorModeId.Shades) {
    return (
      <div className={styles.group}>
        <Select
          minMenuHeight={200}
          options={options}
          value={mode}
          onChange={onModeChange}
          className={styles.select}
          inputId={id}
        />
        <ColorValueEditor value={value?.fixedColor} onChange={onColorChange} />
      </div>
    );
  }

  if (mode === FieldColorModeId.Gradient) {
    return (
      <div className={styles.group}>
        <Select
          minMenuHeight={200}
          options={options}
          value={mode}
          onChange={onModeChange}
          className={styles.select}
          inputId={id}
        />
        <Stack gap={0.5}>
          <ColorValueEditor value={value?.fixedColor ?? GRADIENT_DEFAULT_FROM} onChange={onColorChange} />
          <ColorValueEditor value={value?.gradientColorTo ?? GRADIENT_DEFAULT_TO} onChange={onGradientColorToChange} />
        </Stack>
      </div>
    );
  }

  if (item.settings?.bySeriesSupport && colorMode.isByValue) {
    const seriesModes: Array<SelectableValue<FieldColorSeriesByMode>> = [
      { label: 'Last', value: 'last' },
      { label: 'Min', value: 'min' },
      { label: 'Max', value: 'max' },
    ];

    return (
      <>
        <div style={{ marginBottom: theme.spacing(2) }}>
          <Select minMenuHeight={200} options={options} value={mode} onChange={onModeChange} inputId={id} />
          {schemePreview}
        </div>
        <Field label={t('options-ui.field-color.color-by-label', 'Color series by')}>
          <RadioButtonGroup value={value?.seriesBy ?? 'last'} options={seriesModes} onChange={onSeriesModeChange} />
        </Field>
        {reverseSwitch}
      </>
    );
  }

  if (reverseSwitch) {
    return (
      <>
        <div style={{ marginBottom: theme.spacing(2) }}>
          <Select minMenuHeight={200} options={options} value={mode} onChange={onModeChange} inputId={id} />
          {schemePreview}
        </div>
        {reverseSwitch}
      </>
    );
  }

  return (
    <>
      <Select minMenuHeight={200} options={options} value={mode} onChange={onModeChange} inputId={id} />
      {schemePreview}
    </>
  );
};

interface ModeProps {
  mode: FieldColorMode;
  theme: GrafanaTheme2;
  className?: string;
  label?: string;
}

const FieldColorModeViz: FC<ModeProps> = ({ mode, theme, className, label }) => {
  const styles = useStyles2(getVizStyles);
  const background = getPreviewBackground(theme, mode);

  if (!background) {
    return null;
  }

  return (
    <div
      className={cx(styles.preview, className)}
      style={{ background }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
};

const getVizStyles = (theme: GrafanaTheme2) => ({
  preview: css({
    height: theme.spacing(1),
    width: '100%',
    margin: theme.spacing(0.25, 0),
    borderRadius: theme.shape.radius.default,
  }),
});

const getStyles = (theme: GrafanaTheme2) => {
  return {
    group: css({
      display: 'flex',
    }),
    select: css({
      marginRight: theme.spacing(1),
      flexGrow: 1,
    }),
    schemePreview: css({
      marginTop: theme.spacing(1),
    }),
  };
};
