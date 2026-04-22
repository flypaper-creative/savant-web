import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { z } from "zod";

const db = new Database("database.sqlite");

// --- Schema Definitions ---
const PostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  slug: z.string().min(1),
  author_id: z.string().uuid().optional().or(z.string()),
  status: z.enum(['draft', 'published']),
  published_at: z.string().datetime().nullable().optional(),
});

const UpdatePostSchema = PostSchema.partial();

// --- Database Initialization ---
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    author_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'published')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Advanced Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
  
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/ping", (req, res) => {
    res.json({ 
      status: "pong", 
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString() 
    });
  });

  // API Routes
  apiRouter.get("/posts", (req, res) => {
    const { status } = req.query;
    let query = "SELECT * FROM posts";
    const params: any[] = [];

    if (status === "published") {
      query += " WHERE status = ?";
      params.push("published");
    }

    query += " ORDER BY created_at DESC";

    try {
      const posts = db.prepare(query).all(...params);
      res.json(posts);
    } catch (error) {
      console.error("DB_FETCH_ERROR:", error);
      res.status(500).json({ error: "INTERNAL_LATTICE_ERROR" });
    }
  });

  apiRouter.post("/posts", (req, res) => {
    try {
      const validated = PostSchema.parse(req.body);
      const id = crypto.randomUUID();

      const stmt = db.prepare(`
        INSERT INTO posts (id, title, content, slug, author_id, status, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, validated.title, validated.content, validated.slug, validated.author_id || 'system', validated.status, validated.published_at);
      res.status(201).json({ id, ...validated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "VALIDATION_FAILED", details: error.issues });
      }
      console.error("DB_INSERT_ERROR:", error);
      res.status(500).json({ error: "INTERNAL_LATTICE_ERROR" });
    }
  });

  apiRouter.put("/posts/:id", (req, res) => {
    const { id } = req.params;
    try {
      const validated = UpdatePostSchema.parse(req.body);
      const fields = Object.keys(validated).map(k => `${k} = ?`).join(', ');
      const values = Object.values(validated);

      if (fields.length > 0) {
        const stmt = db.prepare(`
          UPDATE posts 
          SET ${fields}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        stmt.run(...values, id);
      }
      res.json({ success: true, id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "VALIDATION_FAILED", details: error.issues });
      }
      console.error("DB_UPDATE_ERROR:", error);
      res.status(500).json({ error: "INTERNAL_LATTICE_ERROR" });
    }
  });

  apiRouter.delete("/posts/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("DELETE FROM posts WHERE id = ?");
      stmt.run(id);
      res.json({ success: true, message: "NODE_TERMINATED" });
    } catch (error) {
      console.error("DB_DELETE_ERROR:", error);
      res.status(500).json({ error: "INTERNAL_LATTICE_ERROR" });
    }
  });

  // Extraction API
  apiRouter.post("/extract", async (req, res) => {
    try {
      const { SavantExtractor } = await import("./src/utils/ext.js");
      const extractor = new SavantExtractor();
      await extractor.execute({
        scope: ['src/**', 'server.ts', 'package.json', 'tsconfig.json', 'vite.config.ts'],
        outputFile: './archive/savant_source_dump.txt',
        githubRepo: process.env.GITHUB_REPO || '',
        s3Bucket: process.env.AWS_S3_BUCKET || '',
        s3Key: `archives/savant_dump_${Date.now()}.txt`,
      });
      res.json({ success: true, message: "EXTRACTION_COMPLETE" });
    } catch (error) {
      console.error("EXTRACTION_ERROR:", error);
      res.status(500).json({ error: "EXTRACTION_FAILURE", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.use("/api", apiRouter);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), 'dist');

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SAVANT_SERVER_ACTIVE :: PORT_${PORT}`);
  });
}

startServer();
