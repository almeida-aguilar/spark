# Proyectos Spark

Esta carpeta contiene los proyectos guiados para alumnos. Cada proyecto es un archivo `.md` con metadatos (frontmatter YAML) y contenido en Markdown (instrucciones de construcción, imágenes y código).

## Estructura

- `projects/<slug>.md`: instrucciones del proyecto.
- `projects/images/<slug>/...`: imágenes del proyecto (preferible `.webp`), referenciadas desde el Markdown (p. ej. `images/<slug>/preview.webp`).
- `projects/projects-data.json`: generado automáticamente a partir de los `.md` (no editar a mano).

## Formato del archivo `.md`

```md
---
title: "Nombre del proyecto"
difficulty_construction: "fácil"   # fácil | media | difícil (armado/construcción física)
difficulty_code: "básico"          # básico | intermedio | avanzado (programación en Scratch)
peripherals:                        # periféricos que usa el proyecto
  - motor                           # motor | sensor de distancia | sensor de inclinación | botón | luz | doble motor
  - botón
description: "Descripción corta para la tarjeta del catálogo."
tags: ["tag1", "tag2"]
image: "images/<slug>/preview.webp" # vista previa (relativa a la carpeta projects/)
video_youtube: "https://www.youtube.com/watch?v=..." # opcional
---

# Título

## Construcción
Pasos con imágenes `.webp` y, si hace falta, un video de YouTube incrustado/enlazado.

## Programación en Spark
Imágenes `.webp` del programa (bloques) y explicación de cómo recrearlo.

## Cómo probarlo
Qué esperar al ejecutar el proyecto.
```

## Generar el catálogo

Después de agregar o editar proyectos, regenera los datos del showcase:

```sh
node scripts/generate-projects-data.js
# o
npm run generate:projects
```

El showcase (botón **Proyectos** en Spark, o `projects.html`) lee `projects/projects-data.json` y permite filtrar por dificultad de construcción, dificultad de código y periféricos.
