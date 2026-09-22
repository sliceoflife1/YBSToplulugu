import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://deuybs.org.tr";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/settings/",
          "/profile/",
          "/auth/",
          "/reset-password",
          "/forgot-password",
          "/notifications",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
