import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Explicitly serve the Projects directory from public
  const projectsDir = path.join(process.cwd(), "public", "Projects");
  app.use("/Projects", express.static(projectsDir, {
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Content-Security-Policy", "frame-ancestors *");
      // Remove X-Frame-Options to allow embedding in iframes
      res.removeHeader("X-Frame-Options");
      
      if (filePath.endsWith(".pdf")) {
        res.set("Content-Type", "application/pdf");
        res.set("Content-Disposition", "inline");
      }
    }
  }));

  // API to list projects and their files
  app.get("/api/projects", (req, res) => {
    const projectsPath = path.join(process.cwd(), "public", "Projects");
    
    if (!fs.existsSync(projectsPath)) {
      return res.json([]);
    }

    const folders = fs.readdirSync(projectsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const folderPath = path.join(projectsPath, dirent.name);
        const files = fs.readdirSync(folderPath)
          .filter(file => !file.startsWith('.')); // Ignore hidden files
        
        return {
          id: `project-${dirent.name}`,
          title: dirent.name.charAt(0).toUpperCase() + dirent.name.slice(1).replace(/-/g, ' '),
          folderName: dirent.name,
          files: files
        };
      });

    res.json(folders);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, "vite.config.ts"),
      root: __dirname,
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
