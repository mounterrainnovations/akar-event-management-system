export type WebsiteSection =
  | "highlights"
  | "hero-carousel"
  | "members"
  | "publications";

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
  "hero-carousel": {
    section: "hero-carousel",
    label: "Hero Carousel",
    minImages: 1,
    maxImages: 12,
    imagesOnly: true,
  },
  members: {
    section: "members",
    label: "Members",
    minImages: 4,
    maxImages: 50,
    imagesOnly: true,
  },
  publications: {
    section: "publications",
    label: "Publications",
    minImages: 0,
    maxImages: 50,
    imagesOnly: false,
  },
};

export function getSectionRules(section: WebsiteSection): SectionRules {
  return SECTION_RULES[section];
}

export function listWebsiteSectionRules(): SectionRules[] {
  return Object.values(SECTION_RULES);
}

export function isWebsiteSection(value: string): value is WebsiteSection {
  return value in SECTION_RULES;
}
