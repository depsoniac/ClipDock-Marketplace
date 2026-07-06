# ClipDock Marketplace

Estructura de servidor para publicar complementos de ClipDock usando un **catálogo mínimo**.

La idea es que `catalog.json` ya no tenga una lista completa con enlaces de descarga. Solo apunta a la carpeta de plugins:

```txt
https://depsoniac.github.io/ClipDock-Marketplace/catalog.json
```

ClipDock debería hacer este flujo:

```txt
1. Leer catalog.json
2. Tomar discovery.pluginsFolderUrl
3. Leer discovery.pluginsFolderUrl + discovery.folderIndexFile
4. Por cada carpeta listada, leer plugins/<carpeta>/plugin.json
5. Tomar package.file del plugin.json
6. Descargar plugins/<carpeta>/<package.file>
```

## Archivos importantes

```txt
catalog.json
plugins/index.json
plugins/<plugin>/plugin.json
plugins/<plugin>/<plugin>.zip
```

## Cómo agregar un plugin nuevo

Crea una carpeta dentro de `plugins/`:

```txt
plugins/
  mi-plugin/
    plugin.json
    mi-plugin-1.0.0.zip
```

Ejemplo mínimo de `plugin.json`:

```json
{
  "schema": "clipdock.plugin.v1",
  "id": "mi-plugin",
  "slug": "mi-plugin",
  "name": "Mi Plugin",
  "author": "Depson",
  "category": "adobe",
  "type": "adobe-cep",
  "version": "1.0.0",
  "minClipDockVersion": "0.0.1",
  "summary": "Descripción corta para ClipDock.",
  "description": "Descripción más completa del plugin.",
  "installMode": "download-adobe-cep",
  "installDirName": "mi-plugin",
  "package": {
    "file": "mi-plugin-1.0.0.zip",
    "format": "zip"
  }
}
```

El script generador agrega automáticamente dentro de `package`:

```txt
sizeBytes
sizeLabel
sha256
updatedAt
```

No agrega `downloadUrl` al catálogo. La app debe resolver el ZIP usando la carpeta del plugin.

## Generar localmente

```bash
node scripts/build-catalog.js
```

Puedes cambiar la URL base así:

```bash
MARKETPLACE_BASE_URL="https://depsoniac.github.io/ClipDock-Marketplace" node scripts/build-catalog.js
```

## Automatización en GitHub

El workflow `.github/workflows/build-catalog.yml` corre cuando cambie algo dentro de `plugins/` o el script generador.

Genera/actualiza:

```txt
catalog.json
plugins/index.json
plugins/*/plugin.json
```

Para que el workflow pueda guardar esos cambios, activa:

```txt
Settings → Actions → General → Workflow permissions → Read and write permissions
```

## Plugins incluidos

```txt
plugins/clipdock-remote-adobe/plugin.json
plugins/clipdock-remote-adobe/clipdock-remote-adobe-1.0.0.zip

plugins/iphone-orientation-fix/plugin.json
plugins/iphone-orientation-fix/iphone-orientation-fix-6.3.0.zip
```
