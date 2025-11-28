# Sounds Directory

Este directorio contiene los archivos de audio para las notificaciones de FocusFlow.

## Sonidos Requeridos

Los siguientes archivos de sonido son necesarios para las alertas:

1. **work-end.mp3** - Sonido cuando termina el periodo de trabajo
2. **break-end.mp3** - Sonido cuando termina el descanso
3. **cycle-complete.mp3** - Sonido cuando se completa un ciclo completo
4. **achievement.mp3** - Sonido para logros especiales

## Características Recomendadas

- **Formato**: MP3 o OGG (para mejor compatibilidad)
- **Duración**: 1-3 segundos
- **Volumen**: Normalizado, no muy alto
- **Tono**: Agradable, no estridente
- **Tamaño**: < 50KB por archivo

## Recursos para Obtener Sonidos

### Gratuitos y Libres de Derechos:

1. **Freesound** - https://freesound.org/
   - Buscar: "notification", "alert", "chime", "bell"
   - Filtrar por licencia CC0 o CC-BY

2. **Zapsplat** - https://www.zapsplat.com/
   - Categoría: UI Sounds / Notifications

3. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Sección: Multimedia

4. **Notification Sounds** - https://notificationsounds.com/

### Crear Sonidos Personalizados:

1. **Audacity** (Gratis) - https://www.audacityteam.org/
2. **LMMS** (Gratis) - https://lmms.io/
3. **Beepbox** (Online) - https://www.beepbox.co/

## Implementación Actual

Por ahora, el servicio de audio usa tonos generados programáticamente con Web Audio API como fallback. Los archivos de sonido personalizados mejorarán la experiencia del usuario.

## Instrucciones de Instalación

1. Descarga o crea los sonidos siguiendo las características recomendadas
2. Renombra los archivos según la nomenclatura arriba
3. Colócalos en este directorio (`public/sounds/`)
4. Los sonidos se cargarán automáticamente en el servicio de audio
