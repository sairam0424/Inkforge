import type { NextConfig } from "next";
// Load env from monorepo root .env when running locally
// (Next.js automatically loads .env.local in the project root for production)
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = { reactStrictMode: true };
export default nextConfig;
