import { wpFetch } from "./client";
import type { WpPage } from "../../types/wordpress";
import { localizeWpHtml } from "../html";

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  const pages = await wpFetch<WpPage[]>("/wp/v2/pages", {
    searchParams: {
      slug,
      per_page: 1,
      status: "publish",
    },
  });
  return pages[0] ?? null;
}

export async function getPageHtmlBySlug(slug: string): Promise<{ page: WpPage; html: string } | null> {
  const page = await getPageBySlug(slug);
  if (!page) return null;
  return {
    page,
    html: localizeWpHtml(page.content?.rendered || ""),
  };
}
