import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const mode = process.env.NODE_ENV ?? "development";
  const resolvedConfig =
    typeof viteConfig === "function"
      ? await viteConfig({ command: "serve", mode })
      : await Promise.resolve(viteConfig);

  const vite = await createViteServer({
    ...resolvedConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...resolvedConfig.server,
      ...serverOptions,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const pathname = new URL(url, "http://localhost").pathname;
      const page = await vite.transformIndexHtml(url, renderSeoTemplate(template, pathname));
      res.status(isKnownClientRoute(pathname) ? 200 : 404).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

const publicRoutes = new Set(["/", "/services", "/about", "/contact", "/gallery", "/auth", "/admin"]);
const serviceRoutes = new Set([
  "crawl-space-encapsulation",
  "basement-waterproofing",
  "mold-remediation",
  "sump-pump",
  "french-drain",
  "insulation-dehumidification",
]);

type SeoRoute = {
  title: string;
  description: string;
  heading: string;
  intro: string;
};

const seoRoutes: Record<string, SeoRoute> = {
  "/": {
    title: "Crawl Space & Basement Waterproofing in Asheville, NC | CrawlGuard",
    description: "Crawl space and basement waterproofing, encapsulation, mold remediation, and drainage solutions in Asheville and Western North Carolina. Get a free estimate from CrawlGuard LLC.",
    heading: "Expert Crawl Space Waterproofing in Asheville, NC",
    intro: "Protect your home from water damage, mold, and moisture with professional waterproofing solutions from CrawlGuard LLC.",
  },
  "/services": {
    title: "Waterproofing Services in Asheville, NC | CrawlGuard",
    description: "Professional crawl space encapsulation, basement waterproofing, mold remediation, sump pumps, French drains, and moisture control in Asheville and Western North Carolina.",
    heading: "Professional Waterproofing Services",
    intro: "Comprehensive waterproofing solutions to protect your home from water damage, mold, and moisture issues.",
  },
  "/about": {
    title: "About CrawlGuard LLC | Asheville, NC Waterproofing",
    description: "Learn about CrawlGuard LLC, a local waterproofing contractor serving Asheville and Western North Carolina with crawl space and basement moisture solutions.",
    heading: "About CrawlGuard LLC",
    intro: "CrawlGuard LLC helps homeowners across Western North Carolina protect their homes from moisture, mold, and water damage.",
  },
  "/contact": {
    title: "Contact CrawlGuard LLC | Free Waterproofing Estimate",
    description: "Contact CrawlGuard LLC for a free estimate on crawl space encapsulation, basement waterproofing, mold remediation, and drainage services in Western North Carolina.",
    heading: "Get Your Free Waterproofing Estimate",
    intro: "Tell us about your crawl space, basement, or moisture concern and our team will help you plan the next step.",
  },
  "/gallery": {
    title: "Waterproofing Project Gallery | CrawlGuard LLC",
    description: "View CrawlGuard LLC crawl space encapsulation, basement waterproofing, drainage, and moisture-control projects in Asheville and Western North Carolina.",
    heading: "Waterproofing Project Gallery",
    intro: "See examples of crawl space, basement, drainage, and moisture-control work completed by CrawlGuard LLC.",
  },
  "/services/crawl-space-encapsulation": {
    title: "Crawl Space Encapsulation in Asheville, NC | CrawlGuard",
    description: "Full crawl space encapsulation service that stops moisture, mold, and pests with vapor barriers, drainage, and humidity control for Asheville homes.",
    heading: "Seal Out Moisture with Crawl Space Encapsulation",
    intro: "Our team installs a continuous vapor barrier, seals vents, insulates walls, and manages drainage to keep crawl spaces clean and dry.",
  },
  "/services/basement-waterproofing": {
    title: "Basement Waterproofing in Asheville, NC | CrawlGuard",
    description: "Basement waterproofing solutions including drainage, sump pumps, and foundation sealing to prevent flooding and moisture damage in Asheville basements.",
    heading: "Keep Your Basement Dry and Ready to Use",
    intro: "We design basement waterproofing systems for seepage, hydrostatic pressure, foundation cracks, and recurring moisture.",
  },
  "/services/mold-remediation": {
    title: "Mold Remediation in Asheville, NC | CrawlGuard",
    description: "Professional mold remediation that removes contamination, treats affected materials, and addresses moisture sources for long-term prevention.",
    heading: "Remove Mold Safely and Prevent Future Growth",
    intro: "Our team isolates affected areas, removes contaminated materials, treats surfaces, and corrects the moisture source.",
  },
  "/services/sump-pump": {
    title: "Sump Pump Installation in Asheville, NC | CrawlGuard",
    description: "Professional sump pump installation in Greater Asheville and Western North Carolina, including backup systems, discharge routing, and maintenance.",
    heading: "Sump Pump Installation for Crawl Spaces and Basements",
    intro: "We size and install primary and backup sump pumps to remove water before it reaches your crawl space or basement floor.",
  },
  "/services/french-drain": {
    title: "French Drain Installation in Asheville, NC | CrawlGuard",
    description: "Custom French drain systems that capture groundwater and surface runoff, protecting foundations and landscaping in Western North Carolina.",
    heading: "Redirect Water Away from Your Foundation",
    intro: "We design and install interior or exterior French drain systems that collect water and send it safely away from vulnerable areas.",
  },
  "/services/insulation-dehumidification": {
    title: "Crawl Space Dehumidification in Asheville, NC | CrawlGuard",
    description: "Moisture-control services that replace damaged insulation and install crawl space dehumidifiers for balanced humidity in Western North Carolina.",
    heading: "Keep Moisture in Check with Insulation & Dehumidifiers",
    intro: "We remove damaged insulation, install proper thermal barriers, and add dehumidifiers to maintain healthy humidity levels.",
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  })[character] as string);
}

function getSeoRoute(urlPath: string) {
  const normalizedPath = urlPath.replace(/\/$/, "") || "/";
  return seoRoutes[normalizedPath];
}

function renderSeoShell(seo: SeoRoute) {
  const serviceLinks = [
    ["/services/crawl-space-encapsulation", "Crawl space encapsulation"],
    ["/services/basement-waterproofing", "Basement waterproofing"],
    ["/services/mold-remediation", "Mold remediation"],
    ["/services/sump-pump", "Sump pump installation"],
    ["/services/french-drain", "French drain systems"],
    ["/services/insulation-dehumidification", "Insulation and dehumidification"],
  ];

  return `<main data-seo-shell><nav aria-label="Primary navigation"><a href="/">Home</a> <a href="/services">Services</a> <a href="/about">About</a> <a href="/gallery">Gallery</a> <a href="/contact">Contact</a></nav><article><h1>${escapeHtml(seo.heading)}</h1><p>${escapeHtml(seo.intro)}</p><h2>Waterproofing Services</h2><ul>${serviceLinks.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></article></main>`;
}

function renderBusinessSchema(urlPath: string) {
  if (urlPath !== "/") return "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "CrawlGuard LLC",
    description: "Professional crawl space waterproofing, basement waterproofing, and mold remediation services in Asheville, NC and surrounding areas.",
    url: "https://crawlguardllc.com/",
    telephone: "+1-828-206-5924",
    email: "CrawlguardLLC@gmail.com",
    priceRange: "$$",
    sameAs: ["https://www.facebook.com/421107257763173"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Asheville",
      addressRegion: "NC",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "35.5951",
      longitude: "-82.5515",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    areaServed: ["Asheville, NC", "Arden, NC", "Biltmore Forest, NC", "Black Mountain, NC", "Candler, NC", "Canton, NC", "Enka, NC", "Fairview, NC", "Fletcher, NC", "Flat Rock, NC", "Hendersonville, NC", "Hot Springs, NC", "Lake Lure, NC", "Leicester, NC", "Maggie Valley, NC", "Mars Hill, NC", "Marshall, NC", "Mills River, NC", "Montreat, NC", "Skyland, NC", "Swannanoa, NC", "Waynesville, NC", "Weaverville, NC", "Woodfin, NC"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Waterproofing Services",
      itemListElement: [
        "Crawl Space Encapsulation",
        "Basement Waterproofing",
        "Mold Remediation",
        "Sump Pump Installation",
        "French Drain Systems",
        "Insulation & Dehumidification",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
        },
      })),
    },
  };

  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`;
}

function renderSeoTemplate(template: string, urlPath: string) {
  const seo = getSeoRoute(urlPath);
  const withShell = template
    .replace("<!-- SEO_SHELL -->", seo ? renderSeoShell(seo) : "")
    .replace("<!-- SEO_SCHEMA -->", renderBusinessSchema(urlPath));
  if (!seo) return withShell;

  return withShell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`);
}

function isKnownClientRoute(urlPath: string) {
  const normalizedPath = urlPath.replace(/\/$/, "") || "/";
  if (publicRoutes.has(normalizedPath)) return true;
  const serviceId = normalizedPath.match(/^\/services\/([^/]+)$/)?.[1];
  return Boolean(serviceId && serviceRoutes.has(serviceId));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const template = await fs.promises.readFile(indexPath, "utf-8");
    const pathname = new URL(req.originalUrl, "http://localhost").pathname;
    const page = renderSeoTemplate(template, pathname);
    res.status(isKnownClientRoute(pathname) ? 200 : 404).set({ "Content-Type": "text/html" }).send(page);
  });
}
