# Plugins

Cada subcarpeta representa un plugin instalable.

```txt
plugins/
  nombre-del-plugin/
    plugin.json
    archivo-del-plugin.zip
```

`plugins/index.json` se genera automáticamente y solo lista las carpetas disponibles.

ClipDock debe usar esa lista para cargar cada manifiesto:

```txt
plugins/<carpeta>/plugin.json
```
