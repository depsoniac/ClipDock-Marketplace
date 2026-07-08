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
  if (zips.length === 0) return null;
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
  const skipped = [];
  for (const folder of dirs) {
    const dirPath = path.join(PLUGINS_DIR, folder);
    const manifestPath = path.join(dirPath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`Saltando ${folder}: no tiene plugin.json`);
      skipped.push(`${folder} (sin plugin.json)`);
      continue;
    }

    let manifest;
    try {
      manifest = readJson(manifestPath);
    } catch (error) {
      console.warn(`Saltando ${folder}: plugin.json inválido (${error.message})`);
      skipped.push(`${folder} (JSON inválido)`);
      continue;
    }

    let zipFile;
    try {
      zipFile = findZipFile(dirPath, manifest);
    } catch (error) {
      console.warn(`Saltando ${folder}: ${error.message}`);
      skipped.push(`${folder} (ZIP ambiguo)`);
      continue;
    }

    if (!zipFile) {
      console.warn(`Saltando ${manifest.id || folder}: no hay ningún ZIP en la carpeta.`);
      skipped.push(`${manifest.id || folder} (sin ZIP)`);
      continue;
    }

    const zipPath = path.join(dirPath, zipFile);
    if (!fs.existsSync(zipPath)) {
      // Antes esto tiraba un error y tumbaba TODA la tienda por un solo plugin.
      // Ahora solo lo saltamos con aviso: el resto del catálogo se genera igual.
      console.warn(`Saltando ${manifest.id || folder}: declara ${zipFile}, pero ese ZIP no existe en el repo.`);
      skipped.push(`${manifest.id || folder} (falta ${zipFile})`);
      continue;
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
  if (skipped.length) {
    console.warn(`\nAviso: ${skipped.length} plugin(s) saltado(s) por falta de ZIP/manifest:`);
    skipped.forEach((s) => console.warn(`  - ${s}`));
    console.warn('Sube el ZIP que falta para que vuelvan a aparecer en la tienda.');
  }
}

buildFolderManifestRegistry();
