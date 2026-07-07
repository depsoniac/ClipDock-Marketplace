#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const CATALOG_FILE = path.join(ROOT, 'catalog.json');
const PLUGIN_INDEX_FILE = path.join(PLUGINS_DIR, 'index.json');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeBaseUrl(raw) {
  return String(raw || '').replace(/\/+$/, '');
}

function inferBaseUrl() {
  if (process.env.MARKETPLACE_BASE_URL) return normalizeBaseUrl(process.env.MARKETPLACE_BASE_URL);
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (owner && repo) return `https://${owner}.github.io/${repo}`;
  }
  return 'https://depsoniac.github.io/ClipDock-Marketplace';
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sizeLabel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function findZipFile(dirPath, manifest) {
  const declared = manifest.package && (manifest.package.file || manifest.package.zip || manifest.package.fileName);
  if (declared) return declared;
  const zips = fs.readdirSync(dirPath).filter((name) => name.toLowerCase().endsWith('.zip'));
  if (zips.length === 1) return zips[0];
  throw new Error(`No pude resolver el ZIP de ${dirPath}. Declara package.file en plugin.json.`);
}

function cleanGeneratedPackageFields(pkg) {
  const next = { ...(pkg || {}) };
  delete next.fileName;
  delete next.downloadUrl;
  delete next.manifestUrl;
  return next;
}

function buildFolderManifestRegistry() {
  const baseUrl = inferBaseUrl();
  if (!fs.existsSync(PLUGINS_DIR)) {
    throw new Error(`No existe la carpeta ${PLUGINS_DIR}`);
  }

  const dirs = fs.readdirSync(PLUGINS_DIR)
    .filter((name) => fs.statSync(path.join(PLUGINS_DIR, name)).isDirectory())
    .sort((a, b) => a.localeCompare(b));

  const folders = [];
  for (const folder of dirs) {
    const dirPath = path.join(PLUGINS_DIR, folder);
    const manifestPath = path.join(dirPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`Saltando ${folder}: no tiene plugin.json`);
      continue;
    }

    const manifest = readJson(manifestPath);
    const zipFile = findZipFile(dirPath, manifest);
    const zipPath = path.join(dirPath, zipFile);
    if (!fs.existsSync(zipPath)) {
      throw new Error(`El plugin ${manifest.id || folder} declara ${zipFile}, pero ese ZIP no existe.`);
    }

    const stat = fs.statSync(zipPath);
    const packageInfo = {
      ...cleanGeneratedPackageFields(manifest.package),
      file: zipFile,
      format: (manifest.package && manifest.package.format) || 'zip',
      sizeBytes: stat.size,
      sizeLabel: sizeLabel(stat.size),
      sha256: sha256(zipPath),
      updatedAt: stat.mtime.toISOString().slice(0, 10)
    };

    const normalizedManifest = {
      schema: manifest.schema || 'clipdock.plugin.v1',
      ...manifest,
      installDirName: manifest.installDirName || folder,
      package: packageInfo
    };

    // El manifiesto externo queda como fuente principal para ClipDock.
    // No guardamos downloadUrl aquí: la app debe resolver el ZIP relativo a la carpeta del plugin.
    writeJson(manifestPath, normalizedManifest);

    folders.push(folder);
  }

  const catalog = {
    schema: 'clipdock.registry.v1',
    registryVersion: 1,
    generated: true,
    updatedAt: todayISO(),
    name: 'ClipDock Marketplace',
    description: 'Punto de entrada mínimo. ClipDock lee esta URL, abre plugins/index.json y después carga cada plugins/<folder>/plugin.json.',
    discovery: {
      type: 'folder-index',
      pluginsFolderUrl: `${baseUrl}/plugins/`,
      folderIndexFile: 'index.json',
      manifestFile: 'plugin.json'
    }
  };

  const pluginIndex = {
    schema: 'clipdock.plugins.index.v1',
    generated: true,
    updatedAt: todayISO(),
    pluginsFolder: './',
    manifestFile: 'plugin.json',
    count: folders.length,
    folders
  };

  writeJson(CATALOG_FILE, catalog);
  writeJson(PLUGIN_INDEX_FILE, pluginIndex);

  console.log(`Registry mínimo generado -> ${path.relative(ROOT, CATALOG_FILE)}`);
  console.log(`Índice de carpetas generado: ${folders.length} plugin(s) -> ${path.relative(ROOT, PLUGIN_INDEX_FILE)}`);
}

buildFolderManifestRegistry();
