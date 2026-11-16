---
title: "Alarma de proximidad"
difficulty_construction: "media"
difficulty_code: "intermedio"
peripherals:
  - sensor de distancia
  - luz
description: "Usa el sensor de distancia para cambiar la luz cuando un objeto se acerca."
tags: ["sensor", "distancia", "luz"]
image: "images/alarma-proximidad/preview.webp"
---

# Alarma de proximidad

## Construcción
Monta el sensor de distancia en el hub apuntando hacia el frente.

1. **Paso 1:** Conecta el sensor de distancia al hub.  
   ![Sensor de distancia conectado](images/alarma-proximidad/paso-1.webp)
2. **Paso 2:** Fija el hub para que el sensor quede estable.  
   ![Montaje final](images/alarma-proximidad/paso-2.webp)

## Programación en Spark
![Programa de alarma de proximidad](images/alarma-proximidad/codigo.webp)

**Bloques principales:**
- `por siempre` — revisa la distancia continuamente.
- `distancia` (sensor) — lee qué tan cerca está un objeto.
- `si < ... > entonces / si no` — decide qué hacer según la distancia.
- `fijar color de la luz a [COLOR]` — cambia el LED como alerta.

## Cómo probarlo
1. Ejecuta el programa con el hub conectado.
2. Acerca y aleja un objeto frente al sensor.
3. Observa cómo cambia la luz según la proximidad.