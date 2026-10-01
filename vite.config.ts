import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📚 حافظ الجمل</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>`;

function autoHtmlPlugin(): Plugin {
  let created = false;
  const htmlPath = path.resolve(process.cwd(), 'index.html');

  return {
    name: 'auto-html',
    enforce: 'pre',

    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = String(req.url || '').split('?')[0];
        if (url === '/' || url === '/index.html') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(HTML_CONTENT);
          return;
        }
        next();
      });
    },

    buildStart() {
      if (!fs.existsSync(htmlPath)) {
        fs.writeFileSync(htmlPath, HTML_CONTENT, 'utf-8');
        created = true;
      }
    },

    closeBundle() {
      if (created && fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
      }
    },
  };
}

export default defineConfig({
  plugins: [autoHtmlPlugin()],
  server: { open: true, port: 5173 },
  build: { outDir: 'dist', target: 'es2022', emptyOutDir: true },
});