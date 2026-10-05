/**
 * In-page sections after the hero, in page order. Each id is both the section's anchor and
 * its key in `ui[locale].nav`; the nav numbers them in this order.
 */
export const sections = ['about', 'gallery', 'tutorial', 'team', 'contact'] as const;

export type SectionId = (typeof sections)[number];

/** Two-digit display index for the section at position `i` ("01", "02", ...). */
export const sectionIndex = (i: number): string => String(i + 1).padStart(2, '0');
