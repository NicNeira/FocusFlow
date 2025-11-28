# PWA Setup Guide

FocusFlow ha sido configurado como una Progressive Web App (PWA). Esta guía explica la configuración y los pasos finales necesarios.

## ✅ Configuración Completada

1. **vite-plugin-pwa instalado** - Plugin para generación automática de service worker
2. **manifest.json creado** - Configuración de la aplicación PWA
3. **Service Worker registrado** - En index.tsx con auto-actualización
4. **Meta tags PWA agregados** - En index.html para compatibilidad móvil
5. **Estrategia de caché configurada** - Cache-First para CDN resources

## 📱 Funcionalidades PWA

- ✅ Instalable en desktop y móvil
- ✅ Funciona offline después de la primera visita
- ✅ Actualización automática cuando hay nueva versión
- ✅ Notificación al usuario cuando hay actualizaciones
- ✅ Caché optimizado para assets y recursos externos
- ✅ Compatible con iOS (Apple Touch Icons)

## 🎨 Generar Iconos PNG

Los iconos PNG necesarios (192x192 y 512x512) deben generarse a partir del SVG base en `public/icon.svg`.

### Opción 1: Herramientas Online (Recomendado)

1. **RealFaviconGenerator** - https://realfavicongenerator.net/
   - Sube `public/icon.svg`
   - Genera todos los tamaños necesarios
   - Descarga y coloca en `public/`

2. **PWA Builder** - https://www.pwabuilder.com/imageGenerator
   - Sube `public/icon.svg`
   - Descarga los iconos generados
   - Coloca en `public/`

### Opción 2: ImageMagick (CLI)

Si tienes ImageMagick instalado:

```bash
# Generar icono 192x192
convert public/icon.svg -resize 192x192 public/icon-192x192.png

# Generar icono 512x512
convert public/icon.svg -resize 512x512 public/icon-512x512.png
```

### Opción 3: Node.js con Sharp

Instala sharp:
```bash
npm install --save-dev sharp
```

Crea un script de generación:
```javascript
const sharp = require('sharp');

// 192x192
sharp('public/icon.svg')
  .resize(192, 192)
  .png()
  .toFile('public/icon-192x192.png');

// 512x512
sharp('public/icon.svg')
  .resize(512, 512)
  .png()
  .toFile('public/icon-512x512.png');
```

## 🧪 Probar la PWA

### En Desarrollo

```bash
npm run dev
```

El service worker está habilitado en desarrollo (`devOptions: { enabled: true }`)

### En Producción

```bash
# Build
npm run build

# Preview
npm run preview
```

### Verificar Service Worker

1. Abre Chrome DevTools
2. Ve a la pestaña **Application**
3. En el sidebar, selecciona **Service Workers**
4. Verifica que el service worker esté activo

### Auditar con Lighthouse

1. Abre Chrome DevTools
2. Ve a la pestaña **Lighthouse**
3. Selecciona "Progressive Web App"
4. Click en "Generate report"

## 📝 Archivos Importantes

```
├── public/
│   ├── icon.svg              # Icono fuente (SVG)
│   ├── icon-192x192.png      # A generar
│   ├── icon-512x512.png      # A generar
│   └── manifest.json         # Manifest adicional
├── vite.config.ts            # Configuración PWA
├── index.tsx                 # Registro del Service Worker
└── index.html                # Meta tags PWA
```

## 🚀 Instalación

Una vez que la app esté deployada:

### En Desktop (Chrome/Edge)
1. Visita la aplicación
2. Click en el icono de instalación en la barra de direcciones
3. Confirma la instalación

### En iOS (Safari)
1. Visita la aplicación
2. Toca el botón de compartir
3. Selecciona "Agregar a pantalla de inicio"

### En Android (Chrome)
1. Visita la aplicación
2. Toca el menú (3 puntos)
3. Selecciona "Instalar aplicación"

## 🔧 Configuración Avanzada

### Estrategia de Caché

El service worker usa las siguientes estrategias:

- **CacheFirst** para recursos de CDN (aistudiocdn.com, tailwindcss)
- **Precache** para todos los assets buildados
- Expiración de 30 días para recursos externos
- Máximo 50 entradas para CDN cache

### Actualización de Service Worker

Cuando despliegues una nueva versión:
1. El service worker detecta automáticamente la actualización
2. Muestra un prompt al usuario: "Nueva versión disponible. ¿Deseas actualizar?"
3. Si el usuario acepta, recarga la página con la nueva versión
4. Si rechaza, seguirá usando la versión actual hasta el próximo reload

## 📚 Recursos

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Best Practices](https://web.dev/pwa/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
