/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // static export for GitHub Pages
  images: { unoptimized: true }, // no server image optimization on Pages
  trailingSlash: true,       // makes static hosting friendlier (…/page/index.html)
};
module.exports = nextConfig;
