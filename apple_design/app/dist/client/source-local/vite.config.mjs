import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, stat } from "node:fs/promises";

// Buffer generated indexes/downloads and resolve new archives without a server restart.
const downloadCache = new Map();
function serveResearchDownloads(directory) {
  return async (req, res, next) => {
    const pathname = req.url?.split("?")[0];
    if (!["/apple_design/app/dist/client/extraction.json", "/apple_design/app/dist/client/research/manifest.json", "/apple_design/app/dist/client/research/runtime-motion.json", "/apple_design/app/dist/client/research/motion-catalog.json", "/research-source-kit.tar.gz", "/apple_design/app/dist/client/source-design-system-0.1.0.tgz", "/apple_design/app/dist/client/motion-code-kit.tar.gz"].includes(pathname) || !["GET", "HEAD"].includes(req.method)) return next();
    try {
      const file = new URL(directory + pathname, import.meta.url);
      const { mtimeMs } = await stat(file);
      let cached = downloadCache.get(file.href);
      if (!cached || cached.mtimeMs !== mtimeMs) {
        cached = { mtimeMs, body: await readFile(file) };
        downloadCache.set(file.href, cached);
      }
      const body = cached.body;
      res.setHeader("Content-Type", pathname.endsWith(".json") ? "application/json" : "application/gzip");
      res.setHeader("Content-Length", body.length);
      res.setHeader("Cache-Control", "no-cache");
      res.end(req.method === "HEAD" ? undefined : body);
    } catch (error) {
      if (error.code === "ENOENT") return next();
      next(error);
    }
  };
}
const researchDownloads = {
  name: "research-downloads",
  configureServer(server) {
    server.middlewares.use(serveResearchDownloads("./public"));
  },
  configurePreviewServer(server) {
    // A .tar.gz download is the artifact itself, not HTTP gzip transfer encoding.
    server.middlewares.use(serveResearchDownloads("./dist/client"));
  },
};

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    watch: {
      usePolling: true,
      interval: 400,
      // Generated evidence contains tens of thousands of files on the WSL mount.
      // Poll authoring code; evidence indexes/downloads use the middleware above.
      ignored: ["**/public/**", "**/dist/**"],
    },
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), researchDownloads],
});
