---
title: "Robot que avanza"
difficulty_construction: "media"
difficulty_code: "básico"
peripherals:
  - motor
  - botón
description: "Arma un robot con un motor y haz que avance cuando presiones el botón del hub."
tags: ["motor", "movimiento", "robot"]
image: "images/robot-avanza/preview.webp"
---

# Robot que avanza

## Construcción
Arma un vehículo sencillo impulsado por un motor.

1. **Paso 1:** Conecta un motor al puerto del hub.  
   ![Motor conectado al hub](images/robot-avanza/paso-1.webp)
2. **Paso 2:** Monta las ruedas en el motor y asegura la estructura.  
   ![Estructura con ruedas](images/robot-avanza/paso-2.webp)

## Programación en Spark
![Programa del robot que avanza](images/robot-avanza/codigo.webp)

**Bloques principales:**
- `al presionar el botón del hub` — dispara el movimiento.
- `encender motor [MOTOR] durante [N] segundos` — hace avanzar el robot.
- `apagar motor [MOTOR]` — detiene el motor al finalizar.

## Cómo probarlo
1. Coloca el robot en una superficie plana.
2. Conecta el hub y ejecuta el programa.
3. Presiona el botón del hub para que el robot avance.