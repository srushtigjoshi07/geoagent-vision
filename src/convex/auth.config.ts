import type { AuthConfig } from "convex/server";

export default {
  providers: [
    // Standard Convex Auth provider for this project's own sign-in.
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
