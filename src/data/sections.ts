/**
 * In-page sections after the hero, in page order. Each id is both the section's anchor and
 * its key in `ui[locale].nav`; the nav numbers them in this order.
 */
export const sections = ['about', 'gallery', 'tutorial', 'team', 'contact'] as const;

export type SectionId = (typeof sections)[number];
