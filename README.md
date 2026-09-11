# Desvue

**[Try it now →](https://furashcka.github.io/Desvue/)**

![Desvue screenshot](https://raw.githubusercontent.com/furashcka/Desvue/main/public/Scrrenshot.jpg)

Browser-based PSD and PSB inspector for frontend developers. Files are parsed,
rendered, and inspected locally without uploads.

## Features

- PSD and PSB support with drag-and-drop.
- WebAssembly rendering with support for about 95% of Photoshop layer effects.
- Layer tree with groups, visibility controls, clipping, and blend mode markers.
- Layer selection directly on the canvas.
- Generated CSS with syntax highlighting, conversion warnings, and copy support.
- Text content inspection and copying.
- Document-level color palette and font summary.
- Layer spacing and resizable area measurements.
- Eyedropper with a pixel loupe and HEX/RGBA copying.
- Layer export to PNG, JPG, WebP, and SVG.
- Document export to PNG, JPG, and WebP.
- Raster export scales and custom filenames.

## Known limitations

- A small number of uncommon or complex Photoshop effects may render
  differently from Photoshop.
- SVG export may contain a raster image even when the source layer is fully
  vector.
- Raster exports at `@2x`, `@3x`, and `@4x` are not always scaled cleanly.

## Roadmap

- [ ] Figma file support.
- [ ] Sketch file support.
- [ ] Canvas rulers and draggable guides for building layout grids.
- [ ] Preserve vector data throughout SVG export instead of falling back to a
  raster image.
- [ ] Improve raster resampling for `@2x`, `@3x`, and `@4x` exports.
- [ ] Cover the remaining unsupported Photoshop effects.

## Keyboard shortcuts

`V` select · `H` hand · `Space` temporary hand · `I` eyedropper · `M` measure ·
`L` layers panel · `+`/`-` zoom · `0` fit · `Esc` clear

## Stack

Vue 3, Web Workers, Tailwind CSS 4, Prism.js, Font Awesome, Vite.

## License

[MIT](LICENSE)
