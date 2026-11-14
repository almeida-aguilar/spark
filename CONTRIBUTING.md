# Contribuir a Spark

Spark es un fork independiente del editor de Scratch, centrado en LEGO WeDo 2.0 y con funcionamiento 100 % local.
Este documento explica cómo contribuir al proyecto.

## Flujo de trabajo recomendado

1. **Crea una rama** desde `main` con un nombre descriptivo (por ejemplo `fase-web-bluetooth` o `fix-import-sb3`).
   Usa nombres cortos y en minúsculas, sin espacios (guiones o guiones bajos).
2. **Commits pequeños y con mensajes claros.** Spark usa [Conventional Commits](https://www.conventionalcommits.org/).
   Ejemplos:
   - `feat: añadir cola de operaciones GATT al puente Web Bluetooth`
   - `fix: corregir descodificación base64 al escribir`
   - `docs: actualizar inventario de URLs externas`
   - El hook de husky (commitlint) validará el formato; si falla, corrige el mensaje y haz un nuevo commit.
3. **Prueba antes de subir:**
   - `npm run build` (o `npm run build --workspace=<package>`) debe pasar sin errores.
   - `npm test` (o `npm test --workspace=<package>`) debe pasar sin fallos.
   - `npm run lint` (o `npm run test:lint`) sin errores.
4. **Abre un pull request** describiendo el cambio, los tests añadidos y cualquier riesgo conocido.

## Convenciones de código

- **Idioma:** los paquetes existentes siguen su stack heredado (JavaScript, webpack, Jest/Tap). Los nuevos paquetes usan
  TypeScript + Vite + Vitest. No introduzcas TypeScript en paquetes JavaScript ni Vitest en paquetes Jest, a menos que
  la migración sea el objetivo explícito.
- **Estilo:** sigue las convenciones del paquete al que toques. Usa `eslint-config-scratch` (config plana ESLint 9).
  El paquete `task-herder` usa también Prettier; corre `npm run format` allí.
- **Comentarios:** explica el código actual, no su historia. No references implementaciones previas o estados
  intermedios. Si un enfoque parece contraintuitivo, explica por qué es correcto ahora.
- **Strings de usuario:** en `scratch-gui` usa `react-intl` / `FormattedMessage`. No codifiques inglés en JSX.
- **Dependencias:** antes de añadir una nueva dependencia, verifica su licencia y añádela a `THIRD_PARTY_LICENSES`.
  Usa `npm install <pkg>@<version> --workspace=packages/<package>` para instalar (actualiza `package.json` y el lockfile).

## Reglas de trabajo

1. Haz un build limpio y ejecuta los tests existentes antes de cambiar anything. Guarda el resultado como línea base.
2. Una fase = una rama o serie de commits con mensajes claros.
3. Cada fase añade o actualiza tests. Los tests que fallaban antes de empezar se documentan, no se ocultan.
4. Cualquier decisión nueva se registra en `docs/SPARK_DECISIONS.md` (fecha, contexto, decisión, alternativas).
5. Nunca introduzcas dependencias sin comprobar su licencia y añadirla a `THIRD_PARTY_LICENSES`.
6. No elimines los avisos de copyright ni los archivos LICENSE originales.
7. Minimiza el diff sobre archivos upstream para poder integrar cambios futuros de Scratch. El código nuevo va en un
   directorio propio (por ejemplo `spark/`) y los cambios en archivos upstream se marcan con el comentario `// SPARK:`.
8. Cuando algo no se pueda probar sin hardware real (el hub WeDo 2.0), usa mocks y deja la verificación en la lista
   de QA manual.
9. No inventes datos legales (licencias de recursos, textos de marca). Si no puedes verificar algo, exclúyelo y anótalo
   como pendiente.

## Cómo integrar cambios upstream de Scratch

- Revisa regularmente los cambios en los repositorios de los paquetes de Scratch incluidos en el monorepo.
- Cuando actualices un paquete upstream, resuelve los conflictos manualmente y verifica que los cambios de Spark
  (marcados con `// SPARK:`) se mantienen.
- Si un cambio upstream requiere modificar muchos archivos, detente y propone una alternativa más aislada; registra la
  decisión en `docs/SPARK_DECISIONS.md`.

## Antes de enviar

Revisa que se cumple:

- **Alcance:** los cambios se limitan a lo pedido; nothing extra se ha añadido o modificado.
- **Correctitud:** la lógica es sólida y se han considerado los casos edge.
- **Comentarios:** son necesarios, cortos y claros; el código autoexplicativo no tiene comentarios.
- **Simplicidad:** la implementación es tan simple como lo permite; no quedan abstracciones especulativas.
- **Documentación:** se ha actualizado `AGENTS.md` y otros archivos de documentación afectados.
- **Formato de commit:** sigue Conventional Commits (el hook lo validará).
- **Build y tests:** pasan en el paquete afectado.
- **Lint:** sin errores.