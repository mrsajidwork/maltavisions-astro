export type WpRendered = { rendered: string; protected?: boolean };

export type WpPage = {
  id: number;
  slug: string;
  link: string;
  title: WpRendered;
  content: WpRendered;
  excerpt?: WpRendered;
};

export type WpMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
  };
};

export type WpPortfolio = {
  id: number;
  slug: string;
  link: string;
  title: WpRendered;
  content: WpRendered;
  excerpt?: WpRendered;
  featured_media: number;
  menu_order: number;
  _embedded?: {
    "wp:featuredmedia"?: WpMedia[];
  };
};

export type ProjectType = "plugin" | "website";

export type WorkProject = {
  id: number;
  slug: string;
  title: string;
  type: ProjectType;
  kind: string;
  role: string;
  contentHtml: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  /** External live project URL for “Visit the site” in the work popup */
  siteUrl?: string;
};
