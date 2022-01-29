import Texture from './texture';
import StencilMode from '../gl/stencil_mode';
import DepthMode from '../gl/depth_mode';
import CullFaceMode from '../gl/cull_face_mode';
import {
    hillshadeUniformValues,
    hillshadeUniformPrepareValues
} from './program/hillshade_program';

import type Painter from './painter';
import type SourceCache from '../source/source_cache';
import type HillshadeStyleLayer from '../style/style_layer/hillshade_style_layer';
import type {OverscaledTileID} from '../source/tile_id';

import type Framebuffer from '../gl/framebuffer';
import type Tile from '../source/tile';

export default drawHillshade;

function drawHillshade(painter: Painter, sourceCache: SourceCache, layer: HillshadeStyleLayer, tileIDs: Array<OverscaledTileID>) {
    if (painter.renderPass !== 'offscreen' && painter.renderPass !== 'translucent') return;

    const context = painter.context;

    const depthMode = painter.depthModeForSublayer(0, DepthMode.ReadOnly);
    const colorMode = painter.colorModeForRenderPass();
	painter.setDemTextureCacheSize(Math.floor(tileIDs.length));

    const [stencilModes, coords] = painter.renderPass === 'translucent' ?
        painter.stencilConfigForOverlap(tileIDs) : [{}, tileIDs];

    for (const coord of coords) {
        const tile = sourceCache.getTile(coord);
        if (painter.renderPass === 'offscreen') {
            prepareHillshade(painter, tile, layer, depthMode, StencilMode.disabled, colorMode);
        } else if (painter.renderPass === 'translucent') {
            renderHillshade(painter, coord, tile, layer, depthMode, stencilModes[coord.overscaledZ], colorMode);
        }
    }

    context.viewport.set([0, 0, painter.width, painter.height]);
}

function renderHillshade(painter, coord, tile, layer, depthMode, stencilMode, colorMode) {
    const context = painter.context;
    const gl = context.gl;
    const fbo = tile.hillshadeFbo;
    if (!fbo) return;

    const program = painter.useProgram('hillshade');
    const terrain = painter.style.terrainSourceCache.getTerrain(coord);

    context.activeTexture.set(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.colorAttachment.get());

    const terrainCoord = painter.style.terrainSourceCache.isEnabled() ? coord : null;
    program.draw(context, gl.TRIANGLES, depthMode, stencilMode, colorMode, CullFaceMode.disabled,
        hillshadeUniformValues(painter, tile, layer, terrainCoord), terrain, layer.id, painter.rasterBoundsBuffer,
        painter.quadTriangleIndexBuffer, painter.rasterBoundsSegments);

}

// hillshade rendering is done in two steps. the prepare step first calculates the slope of the terrain in the x and y
// directions for each pixel, and saves those values to a framebuffer texture in the r and g channels.
function prepareHillshade(painter, tile, layer, depthMode, stencilMode, colorMode) {
    const context = painter.context;
    const gl = context.gl;
    const dem = tile.dem;
    const terrain = painter.style.terrainSourceCache.getTerrain();
    // We need to update the fbo for the hillshade texture if its not present or the border got backfilled
    const needsFboUpdate = !tile.hillshadeFbo || !!tile.borderBackfillDirty;
    if (dem && dem.data && needsFboUpdate) {
        const tileSize = dem.dim;
        const pixelData = dem.getPixels();
        context.activeTexture.set(gl.TEXTURE1);

        context.pixelStoreUnpackPremultiplyAlpha.set(false);

        // Force a texture re-upload if new data was downloaded, this is typically triggered by a DEM backfill from a neighboring tile.
        const demTexture = painter.getOrCreateDemTextureForTile(tile, pixelData, !!tile.borderBackfillDirty);
        demTexture.bind(gl.NEAREST, gl.CLAMP_TO_EDGE);
        context.activeTexture.set(gl.TEXTURE0);

        const fbo = tile.hillshadeFbo || getHillshadeFbo(tile, painter, tileSize);

        context.bindFramebuffer.set(fbo.framebuffer);
        context.viewport.set([0, 0, tileSize, tileSize]);

        painter.useProgram('hillshadePrepare').draw(context, gl.TRIANGLES,
            depthMode, stencilMode, colorMode, CullFaceMode.disabled,
            hillshadeUniformPrepareValues(tile.tileID, dem),
            terrain, layer.id, painter.rasterBoundsBuffer,
            painter.quadTriangleIndexBuffer, painter.rasterBoundsSegments);

        tile.borderBackfillDirty = false;
    }
}

function getHillshadeFbo(tile: Tile, painter: Painter, size: number): Framebuffer {
    const context = painter.context;

    let fbo = painter.getTileFbo(size);
    if (!fbo) {
        const renderTexture = new Texture(context, {width: size, height: size, data: null}, context.gl.RGBA);
        renderTexture.bind(context.gl.LINEAR, context.gl.CLAMP_TO_EDGE);
        fbo = context.createFramebuffer(size, size, false);
        fbo.colorAttachment.set(renderTexture.texture);
    }

    tile.hillshadeFbo = fbo;
    return fbo;
}