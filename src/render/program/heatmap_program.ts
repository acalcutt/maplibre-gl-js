import {mat4} from 'gl-matrix';

import {
    Uniform1i,
    Uniform1f,
    Uniform2f,
    UniformMatrix4f
} from '../uniform_binding';
import pixelsToTileUnits from '../../source/pixels_to_tile_units';

import type Context from '../../gl/context';
import type Tile from '../../source/tile';
import type {UniformValues, UniformLocations} from '../uniform_binding';
import type Painter from '../painter';
import type HeatmapStyleLayer from '../../style/style_layer/heatmap_style_layer';
import { OverscaledTileID } from '../../source/tile_id';

export type HeatmapUniformsType = {
  'u_extrude_scale': Uniform1f;
  'u_intensity': Uniform1f;
  'u_matrix': UniformMatrix4f;
};

export type HeatmapTextureUniformsType = {
  'u_matrix': UniformMatrix4f;
  'u_world': Uniform2f;
  'u_image': Uniform1i;
  'u_color_ramp': Uniform1i;
  'u_opacity': Uniform1f;
};

const heatmapUniforms = (context: Context, locations: UniformLocations): HeatmapUniformsType => ({
    'u_extrude_scale': new Uniform1f(context, locations.u_extrude_scale),
    'u_intensity': new Uniform1f(context, locations.u_intensity),
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix)
});

const heatmapTextureUniforms = (context: Context, locations: UniformLocations): HeatmapTextureUniformsType => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_world': new Uniform2f(context, locations.u_world),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_color_ramp': new Uniform1i(context, locations.u_color_ramp),
    'u_opacity': new Uniform1f(context, locations.u_opacity)
});

const heatmapUniformValues = (matrix: mat4, tile: Tile, zoom: number, intensity: number): UniformValues<HeatmapUniformsType> => ({
    'u_matrix': matrix,
    'u_extrude_scale': pixelsToTileUnits(tile, 1, zoom),
    'u_intensity': intensity
});

const heatmapTextureUniformValues = (
  painter: Painter,
  tile: Tile,
  layer: HeatmapStyleLayer,
  textureUnit: number,
  colorRampUnit: number,
  coord: OverscaledTileID
): UniformValues<HeatmapTextureUniformsType> => {
    const gl = painter.context.gl;

    return {
        'u_scale_with_map': +(layer.paint.get('heampmap-pitch-scale') === 'map'),
        'u_matrix': calculateMatrix(painter, tile, layer, coord),
        'u_world': [gl.drawingBufferWidth, gl.drawingBufferHeight],
        'u_image': textureUnit,
        'u_color_ramp': colorRampUnit,
        'u_opacity': layer.paint.get('heatmap-opacity')
    };
};

function calculateMatrix(painter, tile, layer, coord) {
    return painter.translatePosMatrix(
        coord ? coord.posMatrix : tile.tileID.posMatrix,
        tile,
        layer.paint.get('heatmap-translate'),
        layer.paint.get('heatmap-translate-anchor')
    );
}

export {
    heatmapUniforms,
    heatmapTextureUniforms,
    heatmapUniformValues,
    heatmapTextureUniformValues
};
