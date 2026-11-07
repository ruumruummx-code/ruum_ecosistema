const fs = require('fs');
const path = require('path');
const { resolve } = require('./servidor.cjs');

const root = path.resolve(__dirname, '../..');

(async () => {
  await require(resolve('esbuild')).build({
    entryPoints: [path.join(__dirname, 'reproduccion-chat.tsx')],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env': '{}' },
    outfile: path.join(__dirname, 'reproduccion-chat.js'),
    nodePaths: [root + '/apps/app-usuario/node_modules', root + '/node_modules/.pnpm/node_modules'],
    tsconfig: root + '/packages/ui/tsconfig.json',
  });

  const html = `<!doctype html>
<html lang="es-MX" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SD-REM-008 · Reproducción Chat</title>
  <link rel="stylesheet" href="showcase.css">
</head>
<body class="bg-gray-50 dark:bg-[#061529] p-4">
  <div id="root"></div>
  <script src="reproduccion-chat.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'reproduccion-chat.html'), html, 'utf-8');
  console.log('reproduccion-chat.html y reproduccion-chat.js construidos con éxito.');
})();
