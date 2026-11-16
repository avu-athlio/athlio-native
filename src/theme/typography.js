import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_600SemiBold_Italic,
  Barlow_700Bold,
  Barlow_700Bold_Italic,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_600SemiBold_Italic,
  BarlowCondensed_700Bold,
  BarlowCondensed_700Bold_Italic,
} from '@expo-google-fonts/barlow-condensed';

// Passed to useFonts() in the root layout.
export const fontAssets = {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_600SemiBold_Italic,
  Barlow_700Bold,
  Barlow_700Bold_Italic,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_600SemiBold_Italic,
  BarlowCondensed_700Bold,
  BarlowCondensed_700Bold_Italic,
};

// Custom fonts on native don't pick a file from `fontWeight`, so each weight
// is its own family. Use these instead of fontWeight/fontStyle.
export const fonts = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  semiboldItalic: 'Barlow_600SemiBold_Italic',
  bold: 'Barlow_700Bold',
  boldItalic: 'Barlow_700Bold_Italic',
  condensedMedium: 'BarlowCondensed_500Medium',
  condensedSemibold: 'BarlowCondensed_600SemiBold',
  condensedSemiboldItalic: 'BarlowCondensed_600SemiBold_Italic',
  condensedBold: 'BarlowCondensed_700Bold',
  condensedBoldItalic: 'BarlowCondensed_700Bold_Italic',
};

// Text styles from styles.css (the Figma text tokens).
// Usage: <Text style={[type['text-sm-medium'], { color: colors.black }]} />
const heading = (fontSize, fontFamily, extra = {}) => ({ fontFamily, fontSize, ...extra });
const italicUpper = { textTransform: 'uppercase' };

export const type = {
  'heading-6xl': heading(64, fonts.condensedBold, { lineHeight: 70 }),
  'heading-6xl-italic': heading(64, fonts.condensedBoldItalic, { lineHeight: 70, ...italicUpper }),
  'heading-5xl': heading(44, fonts.condensedBold),
  'heading-5xl-italic': heading(44, fonts.condensedBoldItalic, { lineHeight: 48, ...italicUpper }),
  'heading-4xl': heading(32, fonts.condensedBold),
  'heading-4xl-italic': heading(32, fonts.condensedBoldItalic, italicUpper),
  'heading-3xl': heading(28, fonts.condensedBold),
  'heading-3xl-italic': heading(28, fonts.condensedBoldItalic, italicUpper),
  'heading-2xl': heading(22, fonts.semibold),
  'heading-2xl-italic': heading(22, fonts.semiboldItalic, italicUpper),
  'heading-xl': heading(18, fonts.semibold, { letterSpacing: -0.18, lineHeight: 24 }),
  'heading-xl-italic': heading(18, fonts.semiboldItalic, {
    letterSpacing: -0.18,
    lineHeight: 24,
    ...italicUpper,
  }),
};

const SIZES = { lg: 18, base: 16, sm: 14, xs: 12, '2xs': 10 };
const WEIGHTS = { bold: fonts.bold, semibold: fonts.semibold, medium: fonts.medium, regular: fonts.regular };

for (const [size, fontSize] of Object.entries(SIZES)) {
  for (const [weight, fontFamily] of Object.entries(WEIGHTS)) {
    type[`text-${size}-${weight}`] = { fontFamily, fontSize };
  }
}
