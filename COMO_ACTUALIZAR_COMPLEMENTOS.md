# Cómo ClipDock detecta updates de complementos

Sí detecta nuevas versiones de complementos, no solo del programa principal.

ClipDock usa este orden:

```txt
catalog.json -> plugins/index.json -> plugins/<carpeta>/plugin.json
```

La detección principal es por `version`:

```txt
versión remota en plugin.json > versión instalada en la PC = UPDATE
```

La app nueva también guarda el `sha256` del ZIP instalado. Si el ZIP remoto cambia y el SHA256 cambia, ClipDock puede marcar update aunque el número de versión sea el mismo. Eso es solo un respaldo; lo correcto es aumentar `version`.

## Para sacar una nueva versión

1. Deja igual `id`, `slug` e `installDirName`.
2. Sube el ZIP nuevo a la misma carpeta del plugin.
3. Cambia `version` en `plugin.json`.
4. Cambia `package.file` al ZIP nuevo.
5. Haz push. El workflow actualiza `sha256`, `sizeBytes`, `sizeLabel` y `updatedAt`.

Ejemplo:

```json
{
  "id": "iphone-orientation-fix",
  "slug": "iphone-orientation-fix",
  "installDirName": "iphone-orientation-fix",
  "version": "6.3.1",
  "package": {
    "file": "iphone-orientation-fix-6.3.1.zip",
    "format": "zip"
  }
}
```

Cuando ClipDock se abre, revisa el marketplace remoto. Si también hay update del programa principal, primero avisa/actualiza ClipDock; después del siguiente arranque vuelve a revisar y ya muestra los updates de complementos.
