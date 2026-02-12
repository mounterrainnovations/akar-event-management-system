export type WebsiteSection = "highlights";

export type SectionRules = {
  section: WebsiteSection;
  label: string;
  minImages: number;
  maxImages: number;
  imagesOnly: boolean;
};

const SECTION_RULES: Record<WebsiteSection, SectionRules> = {
  highlights: {
    section: "highlights",
    label: "Highlights",
    minImages: 6,
    maxImages: 18,
    imagesOnly: true,
  },
};

export function getSectionRules(section: WebsiteSection): SectionRules {
  return SECTION_RULES[section];
}

export function isWebsiteSection(value: string): value is WebsiteSection {
  return value in SECTION_RULES;
}
