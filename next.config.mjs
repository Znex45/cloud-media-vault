import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
