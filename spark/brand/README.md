# Marca de Spark

Definición de personajes en `context/marca.md`: formas primitivas redondeadas
(círculos, cuadrados, triángulos…) con caras kawaii hechas solo de líneas y
puntos: dos ojos muy separados y una sonrisa entre ellos, un poco más abajo.
La mascota principal es **Spark**, una estrella de 6 lados; su segunda forma
(y Quad, el cuadrado) llevan cara "uwu": ojos cerrados felices ("u u") y
boquita de gato ("omega").

## Archivos

| Archivo | Descripción |
|---|---|
| `spark-mascot.svg` | Mascota Spark a color (estrella de 6 lados, ámbar `#FFBF00`, rasgos `#202124`) |
| `spark-mascot-mono.svg` | Variante monocroma (`currentColor`) para menú, favicon e iconos PWA |
| `spark-friends.svg` | Compañeros de Spark: Blip (círculo, azul `#4C97FF`), Quad (cuadrado, verde `#59C059`, cara "uwu"), Tria (triángulo, rosa `#FF6680`) |
| `spark-blip.svg` | Blip individual (fuente del asset de la biblioteca de actores) |
| `spark-quad.svg` | Quad individual, cara "uwu" (fuente del asset de la biblioteca) |
| `spark-tria.svg` | Tria individual (fuente del asset de la biblioteca) |

## Convenciones

- Canvas de referencia: `viewBox="0 0 120 120"` (mascota) — la misma caja sirve
  para iconos de 192/512 px y el favicon escalando el SVG.
- Redondeado de vértices: relleno y trazo del mismo color con
  `stroke-linejoin="round"`; el trazo suaviza los ángulos sin capas extra.
- Las caras usan solo puntos (ojos) y curvas finas con extremos redondeados
  (`stroke-linecap="round"`, sin relleno): sonrisa entre los ojos, un poco más
  abajo; en las caras "uwu", ojos "u u" y boquita de gato. Nunca nariz, cejas
  ni otros rasgos.
- Paleta base (alineada con los colores de bloques de Scratch para que la
  mascota conviva con la UI): ámbar `#FFBF00`, azul `#4C97FF`, verde
  `#59C059`, rosa `#FF6680`, tinta `#202124`.

## Pendiente (Fases 1 y 8)

- PNG de 192 y 512 px (incluido maskable) y `favicon.ico` a partir de
  `spark-mascot-mono.svg` / `spark-mascot.svg`.
- Revisar contraste de los ojos en la variante mono según fondo.
