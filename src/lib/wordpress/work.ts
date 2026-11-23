import type { WorkProject } from "../../types/wordpress";
import { localizeWpHtml, stripTags } from "../html";
import { getPageBySlug } from "./pages";
import { cardClass, pad, resolveProjectType } from "./portfolios";

export type WorkPopItem = {
  title: string;
  kind: string;
  role?: string;
  image: string;
  alt: string;
  content: string;
  href: string;
};

export type WorkIndexData = {
  projects: WorkProject[];
  popData: WorkPopItem[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Work index data from the portfolios page rendered block.
 * Includes external "Visit the site" URLs via wk-pop-data JSON.
 */
export async function getWorkIndexData(): Promise<WorkIndexData> {
  const page = await getPageBySlug("portfolios");
  if (!page) throw new Error("Portfolios page not found");

  const html = page.content?.rendered || "";
  const match = html.match(/id=["']wk-pop-data["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error("wk-pop-data missing from portfolios page render");

  const popData = (JSON.parse(match[1]) as WorkPopItem[]).map((item) => ({
    ...item,
    content: localizeWpHtml(item.content || ""),
    image: item.image || "",
    href: item.href || "",
    alt: item.alt || "",
    kind: item.kind || "",
    title: item.title || "",
  }));

  const projects: WorkProject[] = popData.map((item, index) => {
    const title = stripTags(item.title);
    const type = /plugin/i.test(item.kind) ? "plugin" : resolveProjectType(title);
    const slug = slugify(title);
    return {
      id: index + 1,
      slug,
      title,
      type,
      kind: item.kind || (type === "plugin" ? "Plugin" : "Website"),
      role: item.role || "",
      contentHtml: item.content,
      imageUrl: item.image,
      imageAlt: item.alt || title,
      href: `/portfolio/${slug}/`,
      siteUrl: item.href || "",
    };
  });

  return { projects, popData };
}

export { cardClass, pad };
