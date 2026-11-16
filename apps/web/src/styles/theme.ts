import { darkTheme, type GlobalThemeOverrides } from 'naive-ui';

/** Single source of the palette, shared by Naive UI, the tables and the charts. */
export const palette = {
  background: '#0d1117',
  surface: '#141a23',
  surfaceRaised: '#1a2230',
  border: '#263041',
  textPrimary: '#e6edf3',
  textSecondary: '#9aa7b8',
  textMuted: '#6b778a',
  primary: '#3fb68b',
  primaryHover: '#52c99d',
  gold: '#e3b341',
  danger: '#f06e6e',
  warning: '#e3a041',
  info: '#5aa9e6',
  /**
   * Categorical series for charts, in fixed order (never cycled). Validated on the
   * #141a23 surface: lightness band, chroma, adjacent CVD ΔE ≥ 8.4, normal-vision ΔE ≥ 19.3, contrast ≥ 3:1.
   */
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'],
  /** Sequential single-hue ramp (blue) for heatmaps: near the surface = low value. */
  sequential: ['#1b2a3d', '#184f95', '#2a78d6', '#5598e7', '#9ec5f4'],
} as const;

export const theme = darkTheme;

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily:
      "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
    fontFamilyMono: "'Cascadia Mono', 'JetBrains Mono', Consolas, monospace",
    primaryColor: palette.primary,
    primaryColorHover: palette.primaryHover,
    primaryColorPressed: '#2f9a74',
    primaryColorSuppl: palette.primary,
    infoColor: palette.info,
    warningColor: palette.warning,
    errorColor: palette.danger,
    bodyColor: palette.background,
    cardColor: palette.surface,
    modalColor: palette.surface,
    popoverColor: palette.surfaceRaised,
    tableColor: palette.surface,
    borderColor: palette.border,
    dividerColor: palette.border,
    textColor1: palette.textPrimary,
    textColor2: palette.textPrimary,
    textColor3: palette.textSecondary,
    borderRadius: '8px',
    borderRadiusSmall: '6px',
  },
  Layout: {
    color: palette.background,
    siderColor: palette.surface,
    headerColor: palette.background,
    siderBorderColor: palette.border,
  },
  Card: { borderColor: palette.border, titleFontSizeMedium: '16px' },
  DataTable: {
    thColor: palette.surfaceRaised,
    thColorHover: '#202a3a',
    tdColor: palette.surface,
    tdColorHover: '#18202c',
    borderColor: palette.border,
    thFontWeight: '600',
    thTextColor: palette.textSecondary,
  },
  Menu: {
    itemColorActive: 'rgba(63, 182, 139, 0.14)',
    itemColorActiveHover: 'rgba(63, 182, 139, 0.2)',
    itemTextColorActive: palette.primaryHover,
    itemIconColorActive: palette.primaryHover,
  },
};
