// Design tokens ported 1:1 from the web app's styles.css (:root, light mode).
// Dark-mode tokens exist in the web CSS too; they'll be added with dark mode support.

export const colors = {
  black: '#151622',
  white: '#ffffff',
  muted: '#91909b',

  neutral: {
    bg: '#f6f6f7', // --neutral-50-bg (app background)
    100: '#eeeff1',
    200: '#e1e1e4',
    300: '#cecfd4',
    400: '#b8b9c1',
    500: '#a5a5af',
    600: '#91909b',
    700: '#7d7c86',
    800: '#66656e',
    900: '#55555a',
    950: '#323135',
  },

  primary: {
    50: '#ebf4ff',
    100: '#dbe9ff',
    200: '#bfd6ff',
    300: '#98baff',
    400: '#6f92ff',
    500: '#4e6cff',
    600: '#4051fd',
    700: '#2230e0',
    800: '#1f2cb4',
    900: '#222f8d',
    950: '#141952',
    default: '#4051fd',
  },

  negative: {
    50: '#fff0f0',
    100: '#ffe2e3',
    200: '#ffcace',
    300: '#ff9fa5',
    400: '#ff6976',
    500: '#ff3d52',
    600: '#ff3d52',
    700: '#c8082b',
    800: '#a8092b',
    900: '#8f0c2c',
    950: '#500112',
    default: '#ff3d52',
  },

  success: {
    50: '#eefff3',
    100: '#d7ffe5',
    200: '#b2ffcc',
    300: '#76ffa5',
    400: '#33f578',
    500: '#09de54',
    600: '#00ab3d',
    700: '#049137',
    800: '#0a7130',
    900: '#0a5d2a',
    950: '#003414',
    default: '#00ab3d',
  },

  warning: {
    50: '#fff7ed',
    100: '#ffeed4',
    200: '#ffd9a8',
    300: '#ffbd71',
    400: '#ff983d',
    500: '#fe7611',
    600: '#ef5b07',
    700: '#c64308',
    800: '#9d360f',
    900: '#7e2e10',
    950: '#441406',
    default: '#ff983d',
  },
};
