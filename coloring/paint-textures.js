/* Small deterministic raster-paint helpers. No libraries, network, or generated art. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GPPaintTextures = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TOOLS = Object.freeze(['brush', 'pencil', 'marker', 'crayon', 'fill', 'erase']);
  const clamp = (number, low, high) => Math.min(high, Math.max(low, number));

  function normalizeOptions(options = {}) {
    if (!options || typeof options !== 'object') options = {};
    const size = Number(options.size), seed = Number(options.seed);
    return {
      tool: TOOLS.includes(options.tool) ? options.tool : 'brush',
      color: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(options.color || '') ? String(options.color) : '#a46cda',
      size: Number.isFinite(size) ? clamp(size, 1, 96) : 18,
      seed: Number.isFinite(seed) ? seed >>> 0 : 1
    };
  }

  function seededNoise(x, y, seed = 1) {
    let value = (Math.imul(Math.floor(x), 374761393) ^ Math.imul(Math.floor(y), 668265263) ^ Math.imul(Number(seed) >>> 0, 1274126177)) >>> 0;
    value = Math.imul(value ^ value >>> 13, 1274126177) >>> 0;
    return ((value ^ value >>> 16) >>> 0) / 4294967295;
  }

  function textureAlpha(tool, x, y, seed = 1) {
    if (tool === 'marker') return 1;   // solid, flat colour like the bucket
    if (tool === 'erase' || tool === 'fill') return 1;
    const fine = seededNoise(x, y, seed);
    if (tool === 'pencil') {
      // Colored graphite sits on individual paper fibres, leaving bright pinholes.
      const fibre = seededNoise(Math.floor(x / 3), Math.floor(y / 2), seed + 11);
      return fine < .20 ? .04 : clamp(.23 + fine * .63 + (fibre - .5) * .18, .06, .94);
    }
    if (tool === 'crayon') {
      // Wider wax deposits, with coarser islands and small dry-paper gaps.
      const wax = seededNoise(Math.floor(x / 4), Math.floor(y / 4), seed + 37);
      return wax < .12 || fine < .08 ? .06 : clamp(.34 + wax * .47 + fine * .19, .08, .98);
    }
    // Brush: a little see-through (layers build up), with subtle bristle streaks; the mask feathers the edge.
    const bristle = seededNoise(Math.floor(x / 2), Math.floor(y / 5), seed + 23);
    return clamp(.56 + fine * .14 + (bristle - .5) * .18, .42, .74);
  }

  function pointsOnly(points) {
    return Array.isArray(points) ? points.filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y)) : [];
  }
  function effectiveWidth(options) {
    return options.size * (options.tool === 'pencil' ? .28 : options.tool === 'crayon' ? .96 : options.tool === 'marker' ? 1.12 : 1);
  }
  function strokeBounds(points, options = {}) {
    const valid = pointsOnly(points);
    if (!valid.length) return { x: 0, y: 0, width: 0, height: 0 };
    const padding = effectiveWidth(normalizeOptions(options)) / 2 + 4;
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const point of valid) {
      left = Math.min(left, point.x); top = Math.min(top, point.y);
      right = Math.max(right, point.x); bottom = Math.max(bottom, point.y);
    }
    const x = Math.floor(left - padding), y = Math.floor(top - padding);
    return { x, y, width: Math.ceil(right + padding) - x, height: Math.ceil(bottom + padding) - y };
  }

  function makeCanvas(context, width, height, factory) {
    let canvas;
    if (typeof factory === 'function') canvas = factory(width, height);
    else if (typeof OffscreenCanvas !== 'undefined') canvas = new OffscreenCanvas(width, height);
    else if (context.canvas?.ownerDocument) canvas = context.canvas.ownerDocument.createElement('canvas');
    else if (typeof document !== 'undefined') canvas = document.createElement('canvas');
    else throw new Error('A 2D canvas is required to render paint textures.');
    canvas.width = width; canvas.height = height;
    return canvas;
  }

  function drawPath(context, points, offsetX, offsetY, width, alpha) {
    context.globalAlpha = alpha; context.lineWidth = width;
    context.beginPath();
    context.moveTo(points[0].x - offsetX, points[0].y - offsetY);
    if (points.length === 1) context.lineTo(points[0].x - offsetX + .001, points[0].y - offsetY);
    else for (let i = 1; i < points.length; i++) context.lineTo(points[i].x - offsetX, points[i].y - offsetY);
    context.stroke();
  }

  function renderStroke(context, points, options = {}) {
    const valid = pointsOnly(points);
    if (!valid.length) return null;
    const settings = normalizeOptions(options), bounds = strokeBounds(valid, settings);
    // Clip the scratch allocation to the destination canvas, not the user's
    // pointer travel outside it. The caller's object clip still applies on draw.
    const left = Math.max(0, bounds.x), top = Math.max(0, bounds.y);
    const right = Math.min(context.canvas.width, bounds.x + bounds.width);
    const bottom = Math.min(context.canvas.height, bounds.y + bounds.height);
    if (right <= left || bottom <= top) return null;
    const affected = { x: left, y: top, width: right - left, height: bottom - top };
    const canvas = makeCanvas(context, affected.width, affected.height, options.canvasFactory);
    const scratch = canvas.getContext('2d', { willReadFrequently: true });
    scratch.strokeStyle = settings.tool === 'erase' ? '#ffffff' : settings.color;
    scratch.lineCap = 'round'; scratch.lineJoin = 'round';
    const width = effectiveWidth(settings);
    if (settings.tool === 'brush') {
      drawPath(scratch, valid, left, top, width, .12);
      drawPath(scratch, valid, left, top, width * .88, .30);
      drawPath(scratch, valid, left, top, width * .67, .73);
      // Fine parallel bristles remain within the broad feathered mark.
      scratch.lineWidth = Math.max(.7, width * .038); scratch.globalAlpha = .16;
      for (let strand = -2; strand <= 2; strand++) {
        scratch.beginPath();
        const shift = strand * width * .13;
        scratch.moveTo(valid[0].x - left + shift, valid[0].y - top);
        if (valid.length === 1) scratch.lineTo(valid[0].x - left + shift + .001, valid[0].y - top);
        else for (let i = 1; i < valid.length; i++) scratch.lineTo(valid[i].x - left + shift, valid[i].y - top);
        scratch.stroke();
      }
    } else drawPath(scratch, valid, left, top, width, 1);

    const pixels = scratch.getImageData(0, 0, affected.width, affected.height);
    for (let y = 0; y < affected.height; y++) for (let x = 0; x < affected.width; x++) {
      const index = (y * affected.width + x) * 4 + 3;
      if (pixels.data[index]) pixels.data[index] = Math.round(pixels.data[index] * textureAlpha(settings.tool, x + left, y + top, settings.seed));
    }
    scratch.putImageData(pixels, 0, 0);
    context.save(); context.globalAlpha = 1; context.drawImage(canvas, left, top); context.restore();
    return affected;
  }

  return Object.freeze({ TOOLS, normalizeOptions, seededNoise, textureAlpha, strokeBounds, renderStroke });
});
