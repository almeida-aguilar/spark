# Contribuir a Spark

Spark es un fork independiente del editor de Scratch, centrado en LEGO WeDo 2.0 y con funcionamiento 100 % local.
Este documento explica cómo contribuir al proyecto.

## Requisitos y preparación

- Node.js según `.nvmrc` (incluye npm). Con [mise](https://mise.jdx.dev/) (recomendado): `mise trust && mise install` (usa `mise.toml`).
- Instala dependencias desde la raíz: `npm ci`.
- Spark es un monorepo con npm workspaces; los comandos pueden ejecutarse desde la raíz o con
  `--workspace=packages/<paquete>`.

## Flujo de trabajo

1. **Rama:** crea una rama desde la rama principal de trabajo con un nombre descriptivo (p. ej. `feat/bluetooth-reconnect`
   o `fix/import-sb3`). Usa nombres cortos, en minúsculas y sin espacios.
2. **Commits:** pequeños y con mensajes claros. Se usa [Conventional Commits](https://www.conventionalcommits.org/).
   Ejemplos: `feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `chore: ...`. Husky + commitlint validan el formato en
   cada commit.
3. **Pruebas antes de enviar:**
   - `npm run build` (o por paquete) sin errores.
   - `npm test` (o por paquete) sin fallos. En `scratch-gui`, `npm test` incluye lint, unit, integración y Playwright.
   - `npm run test:lint` en el paquete afectado (o el script de lint correspondiente) sin errores.
4. **Pull request:** describe el cambio, las pruebas añadidas/ejecutadas y cualquier riesgo o limitación (p. ej.
   verificación pendiente con hardware real).

## Convenciones de código

- **Stack:** los paquetes existentes siguen su stack heredado (JavaScript, webpack, Jest/Tap). Los paquetes nuevos usan
  TypeScript + Vite + Vitest (p. ej. `task-herder`). No introduzcas TypeScript en paquetes JavaScript ni Vitest en
  paquetes Jest salvo que la migración sea el objetivo explícito.
- **Estilo:** sigue las convenciones del paquete. ESLint 9 con configuración plana (`eslint-config-scratch`). Si el
  paquete usa Prettier (p. ej. `task-herder`), ejecuta `npm run format`.
- **Marcado Spark:** minimiza el diff sobre archivos upstream para facilitar la integración de cambios futuros. El código
  nuevo va, cuando sea posible, en módulos propios y los cambios en archivos upstream se marcan con el comentario
  `// SPARK:`.
- **Cadenas visibles:** en `scratch-gui` usa `react-intl` / `FormattedMessage`; no codifiques texto de usuario en inglés
  directamente en JSX.
- **Dependencias:** antes de añadir una dependencia, verifica su licencia y actualiza `THIRD_PARTY_LICENSES.md`
  (`node scripts/generate-third-party-licenses.js`). No introduzcas recursos o dominios externos en la app/build.
- **Licencias y recursos:** no elimines avisos de copyright ni archivos `LICENSE` originales. No inventes datos legales
  (licencias, marcas); si algo no se puede verificar, exclúyelo y anótalo como pendiente.

## Reglas de trabajo

1. Comprueba el estado base (build/tests) antes de cambios grandes y registra la línea base si aplica.
2. Cada cambio significativo añade o actualiza pruebas. Los fallos preexistentes se documentan, no se ocultan.
3. Las decisiones de arquitectura y alcance se registran en [`docs/SPARK_DECISIONS.md`](docs/SPARK_DECISIONS.md)
   (fecha, contexto, decisión, alternativas).
4. Lo que no se pueda probar sin hardware real (hub LEGO WeDo 2.0) se cubre con mocks y se deja en la lista de QA
   manual (`context/plan.md`, sección 5).

## Integrar cambios upstream de Scratch

Spark se basa en el monorepo `scratch-editor` de la Scratch Foundation. Para incorporar cambios upstream:

1. **Identifica el origen y el alcance:** revisa los commits/releases relevantes en los paquetes incluidos en este
   monorepo. Prioriza cambios de corrección/seguridad o necesarios para compatibilidad.
2. **Trabaja en una rama dedicada:** integra en una rama específica (p. ej. `chore/upstream-sync-<fecha>`), no
   directamente sobre trabajo de funcionalidades.
3. **Minimiza conflictos:** mantén los cambios de Spark localizados y marcados con `// SPARK:`. Evita refactors amplios
   mezclados con la sincronización.
4. **Resuelve conflictos con cuidado:** preserva la semántica de Spark (sin cuentas/backend/analítica, extensiones
   soportadas, puente Web Bluetooth, almacenamiento local, sin recursos externos). Si un cambio upstream choca con estas
   restricciones, adapta el cambio o documenta la alternativa.
5. **Si el diff upstream es grande o invasivo:** detente y propón una alternativa más aislada (parche puntual, wrapper,
   backport selectivo) y registra la decisión en `docs/SPARK_DECISIONS.md`.
6. **Verifica tras la integración:** ejecuta build, lint y pruebas (unitarias, integración y e2e/Playwright donde
   aplique) y revisa manualmente las áreas afectadas. Comprueba que no se reintroducen dependencias de red, cuentas o
   extensiones eliminadas.
7. **Actualiza documentación:** si cambian comandos, estructura o decisiones, actualiza `README.md`, `AGENTS.md` y
   `docs/` según corresponda.

## Antes de enviar

- **Alcance:** los cambios se limitan a lo solicitado.
- **Correctitud y simplicidad:** lógica sólida, sin abstracciones especulativas.
- **Pruebas:** build y pruebas del paquete afectado en verde (en la medida de lo posible en el entorno).
- **Lint:** sin errores.
- **Documentación:** actualizada si el cambio lo requiere.
- **Formato de commit:** Conventional Commits (validado por el hook).
- **CI:** los cambios deben mantener en verde los checks de CI (lint, pruebas, e2e, build y comprobaciones automáticas).