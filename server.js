import express, { json } from 'express';
import fs from 'fs';
import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { config as _config } from 'dotenv';
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
import cors from 'cors';
import path from 'path';
import readline from 'readline';
import { parse, modify, applyEdits } from 'jsonc-parser';
import { settings, dirs, jsonc, config, functions } from './modules.js';

const { PORT, VERSION, LOG_DIR } = settings;
const { routesDir, configPath, dataDir } = dirs;
const { newRaw } = jsonc;
const { log, clearLogs, clearCurrentLogs } = functions;
const app = express();

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const shouldClearLogs = config.logging?.clearOnNextStart || process.argv.includes('--clear-logs');

if (shouldClearLogs) {
  clearLogs(LOG_DIR);
  config.logging.clearOnNextStart = false; // Reset flag
  fs.writeFileSync(configPath, newRaw, 'utf-8');
  clearCurrentLogs(LOG_DIR);
  process.exit(0);
}

app.use(json());
app.use((req, res, next) => {
  log(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

const getMSg = config.info?.getmsg;
app.get('/api/', cors(), (req, res) => {
  res.status(200).json({ message: `${getMSg}`});
});
app.post('/api/', cors(), (req, res) => {
  res.status(200).json({ message: `${getMSg}` });
});

if (!config.routes) config.routes = {};
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
let updated = false;
// Mount routes
for (const file of routeFiles) {
  const routeName = file.replace('.js', '');

  // Auto-add missing routes to config.json as disabled
  if (!(routeName in config.routes)) {
    config.routes[routeName] = false;
    updated = true;
    console.log(`Added ${routeName} to config.json as disabled`);
    log(`Added ${routeName} to config.json as disabled`);
  }

  // Only load if enabled
  if (config.routes[routeName]) {
    const routeModule = await import(join(routesDir, file));
    if (!routeModule.default) {
      console.warn(`⚠️ ${file} does not export a default router`);
      log(`${file} does not export a default router`, 'warn');
      continue;
    }

    app.use(`/api/${routeName}`, routeModule.default);
    console.log(`🛠️ Mounted /api/${routeName} from ${file}`);
    log(`Mounted /api/${routeName} from ${file}`);
  }
}
// Remove config entries for missing files
for (const routeName of Object.keys(config.routes)) {
  if (!routeFiles.includes(routeName + '.js')) {
    delete config.routes[routeName];
    updated = true;
    console.log(`Removed ${routeName} from config.json (file missing)`);
    log(`Removed ${routeName} from config.json (file missing)`);
  }
}
// Save config.json if updated
if (updated) {
  fs.writeFileSync(configPath, newRaw, 'utf-8');
  console.log('Updated config.json');
  log(`Updated config.json`, 'info');
}

app.listen(PORT, () => {
  log(`Server v${VERSION} running on http://localhost:${PORT}`);
  console.log(`Server v${VERSION} running on http://localhost:${PORT}`);
  log(`Server started at ${new Date().toISOString()}`, 'info');
  console.log(`Server started at ${new Date().toISOString()}`);
});