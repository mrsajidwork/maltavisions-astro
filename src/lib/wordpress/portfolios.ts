import { wpFetch, wpFetchCollection } from "./client";
import type { ProjectType, WorkProject, WpPortfolio } from "../../types/wordpress";
import { localizeWpHtml, stripTags } from "../html";

const PLUGIN_TITLES = new Set(
  [
    "Easy Social Feed",
    "Easy Social Photos Gallery",
    "Easy Tiktok Feed",
    "SonaWP",
    "WPOptin",
    "Floating Links",
  ].map((t) => t.toLowerCase()),
);

export function resolveProjectType(title: string): ProjectType {
  return PLUGIN_TITLES.has(title.trim().toLowerCase()) ? "plugin" : "website";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function cardClass(index: number, total: number): string {
  const first = index % 2 === 0;
  if (index === total - 1 && first) return "wk-card is-full";
  const pair = Math.floor(index / 2);
  const wide = pair % 2 === 0 ? first : !first;
  return wide ? "wk-card is-wide" : "wk-card is-narrow";
}

function mapPortfolio(item: WpPortfolio): WorkProject {
  const title = stripTags(item.title?.rendered || "");
  const type = resolveProjectType(title);
  const media = item._embedded?.["wp:featuredmedia"]?.[0];
  return {
    id: item.id,
    slug: item.slug,
    title,
    type,
    kind: type === "plugin" ? "Plugin" : "Website",
    role: "",
    contentHtml: localizeWpHtml(item.content?.rendered || ""),
    imageUrl: media?.source_url || "",
    imageAlt: media?.alt_text || title,
    href: `/portfolio/${item.slug}/`,
  };
}

export async function getAllPortfolios(): Promise<WorkProject[]> {
  const items = await wpFetchCollection<WpPortfolio>("/wp/v2/portfolio", {
    perPage: 100,
    searchParams: {
      _embed: "1",
      orderby: "title",
      order: "asc",
      status: "publish",
    },
  });
  return items.map(mapPortfolio);
}

export async function getPortfolioBySlug(slug: string): Promise<WorkProject | null> {
  const items = await wpFetch<WpPortfolio[]>("/wp/v2/portfolio", {
    searchParams: {
      slug,
      _embed: "1",
      per_page: 1,
      status: "publish",
    },
  });
  return items[0] ? mapPortfolio(items[0]) : null;
}

export function projectCounts(projects: WorkProject[]) {
  return {
    all: projects.length,
    plugin: projects.filter((p) => p.type === "plugin").length,
    website: projects.filter((p) => p.type === "website").length,
  };
}

export { pad };
