/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    allowedDevOrigins: ["127.0.0.1"],
    turbopack: {
        root: process.cwd(),
    },
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
};

export default nextConfig;
