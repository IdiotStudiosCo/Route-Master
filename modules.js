import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { parse, modify, applyEdits } from 'jsonc-parser';

const __filename = fileURLToPath(import.meta.url);
const dir = dirname(__filename);
const dataDir = join(dir, 'data');
const routesDir = join(dir, 'routes');
const configPath = join(dir, 'config.jsonc')
const configContent = fs.readFileSync(configPath, 'utf8');
export let config = parse(configContent);
const packagepath = join(dir, 'package.json')
let packagejson = JSON.parse(fs.readFileSync(packagepath, 'utf8'));

export const dirs = {
  dir,
  dataDir,
  routesDir,
  configPath
}

const raw = fs.readFileSync(configPath, 'utf-8');
const edits = modify(raw, ['logging', 'clearOnNextStart'], false, {
    formattingOptions: { insertSpaces: true, tabSize: 2 }
});
const newRaw = applyEdits(raw, edits);

export const jsonc = {
  raw,
  edits,
  newRaw
}

const PORT = config.info?.port || 3000;
const VERSION = packagejson?.version || '1.0.0';
const corsOptions = {
  origin: config.cors?.origin,
  methods: config.cors?.methods || ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
// Use logging config from config.json
const LOG_LEVEL = config.logging?.level || 'info';
const LOG_DIR = config.logging?.dir || 'logs/';
const LOG_FILE = getNextLogFile(LOG_DIR);

export const settings = {
  PORT,
  VERSION,
  LOG_LEVEL,
  LOG_DIR,
  LOG_FILE,
  corsOptions
};

const ApiKeysData = JSON.parse(fs.readFileSync(`${dataDir}/keys.json`, 'utf8'));
const validApiKeys = ApiKeysData.keys || [];

function log(message, level = 'info') {
  if (!config.logging?.enabled) return; // Skip logging if disabled
  if (['info', 'warn', 'error'].includes(level) && level >= LOG_LEVEL) {
    const logMsg = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMsg, 'utf8');
    if (level !== 'info') console[level](logMsg.trim());
  }
}
function apiKeyCheck(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const apiKey = authHeader.replace('Bearer ', '').trim();

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  req.apiKey = apiKey;
  next();
}
function getNextLogFile(logDir) {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const files = fs.readdirSync(logDir);
  const logNums = files
    .map(f => /^server-(\d+)\.log$/.exec(f))
    .filter(Boolean)
    .map(match => parseInt(match[1], 10));
  const nextNum = logNums.length ? Math.max(...logNums) + 1 : 1;
  return path.join(logDir, `server-${nextNum}.log`);
}
function clearLogs(logDir) {
  if (!fs.existsSync(logDir)) return;
  const files = fs.readdirSync(logDir);
  for (const file of files) {
    const filePath = path.join(logDir, file);
    if (fs.statSync(filePath).isFile() && file.startsWith('server-') && file.endsWith('.log')) {
      fs.unlinkSync(filePath);
    }
  }
  console.log(`Cleared logs in ${logDir}`);
  log(`Cleared logs in ${logDir}`);
}
function clearCurrentLogs(logDir) {
  if (!fs.existsSync(logDir)) return;
  const files = fs.readdirSync(logDir);
  for (const file of files) {
    const filePath = path.join(logDir, file);
    if (fs.statSync(filePath).isFile() && file.startsWith('server-') && file.endsWith('.log')) {
      fs.unlinkSync(filePath);
    }
  }
}

export const functions = {
  log,
  getNextLogFile,
  clearLogs,
  clearCurrentLogs,
  apiKeyCheck
};
