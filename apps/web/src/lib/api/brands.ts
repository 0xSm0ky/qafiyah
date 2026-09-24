import * as v from 'valibot';

const TRANSLITERATED_SLUG_REGEX = /^[a-z][a-z-]*$/;
const TRANSLITERATED_SLUG_MESSAGE = 'slug must be lowercase letters and hyphens';
const FOUR_LETTER_REGEX = /^[a-zA-Z]{4}$/;

const transliterated = <const TBrand extends string>(brand: TBrand) =>
  v.pipe(
    v.string(),
    v.regex(TRANSLITERATED_SLUG_REGEX, TRANSLITERATED_SLUG_MESSAGE),
    v.brand(brand)
  );

const fourLetter = <const TBrand extends string>(brand: TBrand, message: string) =>
  v.pipe(v.string(), v.regex(FOUR_LETTER_REGEX, message), v.brand(brand));

const eraSlugSchema = transliterated('EraSlug');
export type EraSlug = v.InferOutput<typeof eraSlugSchema>;

const meterSlugSchema = transliterated('MeterSlug');
export type MeterSlug = v.InferOutput<typeof meterSlugSchema>;

const rhymeSlugSchema = transliterated('RhymeSlug');
export type RhymeSlug = v.InferOutput<typeof rhymeSlugSchema>;

const themeSlugSchema = transliterated('ThemeSlug');
export type ThemeSlug = v.InferOutput<typeof themeSlugSchema>;

const collectionSlugSchema = transliterated('CollectionSlug');
export type CollectionSlug = v.InferOutput<typeof collectionSlugSchema>;

const poetSlugSchema = fourLetter('PoetSlug', 'poet slug must be exactly 4 letters');
export type PoetSlug = v.InferOutput<typeof poetSlugSchema>;

export const poemSlugSchema = fourLetter('PoemSlug', 'poem slug must be exactly 4 letters');
export type PoemSlug = v.InferOutput<typeof poemSlugSchema>;
