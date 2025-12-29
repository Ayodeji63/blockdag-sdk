import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_PUBLIC_GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
    VITE_PUBLIC_APPLE_OAUTH_CLIENT_ID: z.string().min(1),
    VITE_PUBLIC_FACEBOOK_CLIENT_ID: z.string().min(1),
    VITE_PUBLIC_RP_ID: z.string().optional(),
    VITE_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    VITE_PUBLIC_APP_URL: z.string().optional(),
    VITE_PUBLIC_BASE_URL: z.string().min(1),
    VITE_PUBLIC_ORGANIZATION_ID: z.string().min(1),
    VITE_PUBLIC_ALCHEMY_API_KEY: z.string().min(1),
    VITE_PUBLIC_FACEBOOK_AUTH_VERSION: z.string().min(1),
    VITE_PUBLIC_AUTH_IFRAME_URL: z.string().optional(),
    VITE_PUBLIC_EXPORT_IFRAME_URL: z.string().optional(),
    VITE_PUBLIC_IMPORT_IFRAME_URL: z.string().optional(),
    VITE_PUBLIC_AUTH_PROXY_ID: z.string().min(1),
    VITE_PUBLIC_AUTH_PROXY_URL: z.string().min(1).optional(),
  },
  runtimeEnv: import.meta.env, // Use import.meta.env for Vite
  emptyStringAsUndefined: true,
});