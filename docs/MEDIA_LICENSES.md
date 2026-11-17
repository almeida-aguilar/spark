# Media library licenses

The costume, backdrop, sound and sprite libraries shipped with Spark
(`packages/scratch-gui/src/lib/libraries/*.json` and the assets they reference,
downloaded into `packages/scratch-gui/static/library-assets/`) come from the
Scratch media library.

- **Source**: the media library of the Scratch editor
  (<https://github.com/scratchfoundation/scratch-editor>, package
  `scratch-gui`). The asset files were downloaded from the Scratch Foundation's
  public asset CDN with `packages/scratch-gui/scripts/fetch-library-assets.js`.
- **Copyright**: © the Scratch Foundation (<https://scratchfoundation.org/>)
  and MIT Media Lab for the older artwork.
- **License**: Creative Commons Attribution-ShareAlike 2.0
  (<https://creativecommons.org/licenses/by-sa/2.0/>). This is how Scratch
  publishes its images and sounds (<https://scratch.mit.edu/info/credits/>).
- **License notice in the application**: the "About Spark" dialog mentions that
  Spark is based on Scratch and shows the link to the source code. The five
  Spark brand assets added to the library are original work (AGPL-3.0-only),
  as noted below.
- **Local optimization**: `scripts/optimize-library-assets.js` recompresses the
  PNG, SVG and WAV files in place. Filenames and formats are unchanged so the
  library JSON and `.sb3` references stay valid; consequently a filename is no
  longer the MD5 of the stored bytes. The optimization runs when fetching the
  library and during `npm run build` (see `docs/PWA_SIZE_BUDGET.md`).

The music and WeDo 2.0 extension assets bundled inside
`packages/scratch-vm` keep their original distribution within the Scratch
editor code (AGPL-3.0-only) and are covered by the general NOTICE of this
repository. LEGO and WeDo are trademarks of the LEGO Group; see NOTICE.

The Spark logo and other brand assets in `spark/brand` are original work of
the Spark contributors, licensed like the rest of the project under
AGPL-3.0-only.
