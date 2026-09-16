import { z } from 'zod';

/**
 * Schemas for the résumé content.
 *
 * These are parsed at module load, so a malformed or incomplete record fails
 * `npm run build` rather than rendering a blank section. `zod` is a direct
 * dependency rather than Astro's `astro:content` re-export because the test
 * suite imports these records too, and `astro:content` is a virtual module that
 * only exists inside Astro's build.
 *
 * See specs/0003-resume-content-page.md.
 */

const nonEmpty = z.string().trim().min(1);

/** A link in the link bank. Absolute https URLs only — see the privacy rules. */
export const linkSchema = z.object({
  label: nonEmpty,
  href: z.string().url().startsWith('https://'),
  description: nonEmpty,
});

export const profileSchema = z.object({
  name: nonEmpty,
  descriptor: nonEmpty,
  location: nonEmpty,
  summary: nonEmpty,
  /** Start of professional experience, used to derive the years figure. */
  careerStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const entrySchema = z.object({
  /** Stable identifier, used for anchors now and for per-entry pages later. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: nonEmpty,
  organisation: nonEmpty,
  /** Team or programme within the organisation, where there is one. */
  context: nonEmpty.optional(),
  start: nonEmpty,
  end: nonEmpty,
  location: nonEmpty.optional(),
  highlights: z.array(nonEmpty).min(1),
});

export const educationSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  institution: nonEmpty,
  qualification: nonEmpty,
  focus: nonEmpty.optional(),
  start: nonEmpty,
  end: nonEmpty,
  location: nonEmpty,
});

export const skillGroupSchema = z.object({
  name: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export type Link = z.infer<typeof linkSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
