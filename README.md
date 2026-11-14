# TarotGPT

Rediseño Bootstrap de la app FastAPI existente. La plantilla está en `templates/index.html`; los recursos públicos están en `static/`.

## Ejecutar

Desde `tarot_py/`:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Abrí `http://127.0.0.1:8000`. La interpretación requiere la configuración de OpenAI que ya utiliza el servidor. La plantilla se sirve desde FastAPI; no está pensada para abrirse con `file://`.

## Interfaz y cartas

- `templates/index.html`: nueva estética clara, formulario, elección de mazo, selección de cartas, espera y lectura.
- `static/assets/tarot.js`: navegación, validaciones, imágenes, cartas propias y llamada al endpoint existente.
- `static/cards/cards.js`: motor de selección adaptado del módulo original, sin dependencia de jQuery. Conserva `createCardGroup`, `sizeCards`, `generarCadenaAleatoria` y el evento `cards` con los índices seleccionados.
- `static/tarot-images.json` y `static/cards/`: catálogo de 78 cartas e imágenes originales, sin modificaciones.
- `templates/index_old.html`: interfaz anterior, sin modificaciones.

El motor mezcla las 78 cartas con Fisher–Yates y elige 40 posiciones para el abanico, como en la interfaz original. Así, las cartas fuera de las primeras 40 posiciones del JSON también pueden salir. Cada posición se selecciona una sola vez y la tirada termina al elegir tres. El azar se obtiene con `crypto.getRandomValues` y muestreo por rechazo para evitar sesgo de módulo. Cada nueva mezcla reconstruye el orden sin modificar el catálogo.

El módulo anterior evitaba seleccionar posiciones repetidas, pero su único uso de azar generaba identificadores de grupos. Se agregó la mezcla de identidades dentro del mismo módulo para que esa garantía no dependa de la interfaz.

Las cartas propias pueden ingresarse manualmente y tienen sugerencias del catálogo. Si un nombre no coincide, se conserva lo escrito para enviarlo al servidor, sin asociarle una imagen incorrecta.

## API y errores

Se conserva `POST /api/tarot` con `{name, question, cards}` y el formato de cartas `1)The Star.2)The Sun.3)The Fool.`. La respuesta usa `cards[].meaning` y `resume` como antes. Se muestran interpretaciones para la cantidad de cartas enviada; las respuestas incompletas muestran un error recuperable.

Los errores de catálogo o interpretación permiten reintentar. La pregunta y las cartas se conservan durante la visita. Los textos del usuario y del servidor se muestran sin ejecutar HTML. No hay lecturas simuladas ni un mazo alternativo de ilustraciones.

## Verificación

Se verificaron los archivos de imagen de las 78 cartas, la mezcla sin duplicados ni modificación del catálogo y la posibilidad de obtener las 78 cartas en los grupos de 40. En navegador se probaron selección y eventos, imágenes, nombres y orden del payload, remezcla, cartas propias, errores/reintentos, seis anchos de pantalla y movimiento reducido.

Las respuestas de `/api/tarot` se simularon en las pruebas, sin llamadas pagas a OpenAI. No se cambió el backend ni se verificó una interpretación real contra OpenAI.
