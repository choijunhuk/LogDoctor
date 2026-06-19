/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — the app is fully client-side (localStorage only), so it
  // ships as plain files behind nginx. No Node process on the server.
  output: "export",
  // Served from https://coms.kw.ac.kr/LogDoctor (sub-path behind nginx alias).
  basePath: "/LogDoctor",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
