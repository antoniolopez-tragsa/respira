# Respira — una pausa para ti

Aplicación web estática de respiración guiada, creada con HTML, Tailwind CSS y JavaScript. No necesita servidor de aplicación, base de datos, cuenta de usuario ni analítica.

## Funciones

- Patrones predefinidos: **4/6/8**, **4/4/4**, respiración en caja **4/4/4/4**, **4/7/8** y respiración suave **5/5**.
- Duración de cada fase ajustable entre 0 y 60 segundos (la inspiración y la exhalación tienen un mínimo de 1 segundo; las retenciones pueden ponerse a 0 para omitirlas).
- Avisos de audio al comenzar cada fase, usando los tres archivos de audio aportados: `inspira.mp3`, `aguanta.mp3` y `exhala.mp3`.
- Botón único para comenzar y terminar, contador visual, recuento de ciclos y sesión de duración opcional.
- Dos pistas ambientales seleccionables, volumen y activación independiente.
- Diseño responsive, soporte para movimiento reducido y PWA con caché local de la aplicación y de los avisos de voz.

## Publicar en GitHub Pages

1. Crea un repositorio de GitHub y sube el contenido de esta carpeta manteniendo la estructura de directorios.
2. En el repositorio, abre **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/ (root)` y guarda.
4. Abre la URL de GitHub Pages una vez publicada. La instalación PWA y el service worker requieren HTTPS (GitHub Pages lo proporciona).
5. En Android, abre la web con Chrome y elige **Instalar app** cuando aparezca el botón o usa el menú del navegador → **Instalar aplicación / Añadir a pantalla de inicio**.

El proyecto usa rutas relativas para poder funcionar tanto en el dominio raíz de GitHub Pages como en una URL del tipo `usuario.github.io/nombre-repositorio/`.

## Música y licencias

Las pistas **no están incluidas dentro del repositorio**: se cargan bajo demanda desde Wikimedia Commons para mantener el tamaño del proyecto pequeño. Por tanto, la música necesita conexión a internet; el resto de la aplicación y los avisos de voz se guardan en caché para el uso sin conexión después de la primera visita.

- **“Wholesome” — Kevin MacLeod**, licencia [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Wholesome_by_Kevin_MacLeod.ogg). Descripción de la pista en la fuente: música cinematográfica calmada, con pocos cambios, pensada como fondo.
- **“Peaceful ambient” — Tamlin Lollis Love**, licencia [Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/). Fuente: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Peaceful.ogg).

Se conservan enlaces a la fuente y a la licencia en la interfaz. Las licencias se aplican a cada obra musical por separado; no las sustituye la licencia del código de esta aplicación.

### Licencia del código

El código propio de esta aplicación se publica bajo **0BSD**, una licencia permisiva sin obligación de atribución. Consulta el archivo `LICENSE`. Los audios de avisos se han recibido como archivos aportados para el proyecto y no se les asigna una licencia nueva en este repositorio; confirma que tienes permiso para redistribuirlos si vas a publicar los archivos de audio junto con la web.

## Nota de bienestar

La aplicación es una ayuda de relajación general, no un tratamiento médico. Los tiempos son orientativos: no fuerces la respiración ni mantengas el aire si te resulta incómodo. Reduce los tiempos, elige el patrón suave o detén la sesión si notas mareo o malestar.
