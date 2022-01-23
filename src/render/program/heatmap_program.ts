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
import type {OverscaledTileID} from '../../source/tile_id';


export type HeatmapUniformsType = {
  'u_camera_to_center_distance': Uniform1f;
  'u_scale_with_map': Uniform1i;
  'u_pitch_with_map': Uniform1i;
  'u_intensity': Uniform1f;
  'u_extrude_scale': Uniform2f;
  'u_device_pixel_ratio': Uniform1f;
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
    'u_camera_to_center_distance': new Uniform1f(context, locations.u_camera_to_center_distance),
    'u_scale_with_map': new Uniform1i(context, locations.u_scale_with_map),
    'u_pitch_with_map': new Uniform1i(context, locations.u_pitch_with_map),
    'u_intensity': new Uniform1f(context, locations.u_intensity),
    'u_extrude_scale': new Uniform2f(context, locations.u_extrude_scale),
    'u_device_pixel_ratio': new Uniform1f(context, locations.u_device_pixel_ratio),
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix)
});

const heatmapTextureUniforms = (context: Context, locations: UniformLocations): HeatmapTextureUniformsType => ({
    'u_matrix': new UniformMatrix4f(context, locations.u_matrix),
    'u_world': new Uniform2f(context, locations.u_world),
    'u_image': new Uniform1i(context, locations.u_image),
    'u_color_ramp': new Uniform1i(context, locations.u_color_ramp),
    'u_opacity': new Uniform1f(context, locations.u_opacity)
});

const heatmapUniformValues = (
  painter: Painter,
  coord: OverscaledTileID,
  tile: Tile,
  layer: HeatmapStyleLayer
): UniformValues<HeatmapUniformsType> => {
    const transform = painter.transform;

    let pitchWithMap: boolean, extrudeScale: [number, number];
    if (layer.paint.get('heatmap-pitch-alignment') === 'map') {
        const pixelRatio = pixelsToTileUnits(tile, 1, transform.zoom);
        pitchWithMap = true;
        extrudeScale = [pixelRatio, pixelRatio];
    } else {
        pitchWithMap = false;
        extrudeScale = transform.pixelsToGLUnits;
    }

    return {
        'u_camera_to_center_distance': transform.cameraToCenterDistance,
        'u_scale_with_map': +(layer.paint.get('heatmap-pitch-scale') === 'map'),
        'u_matrix': painter.translatePosMatrix(
            coord.posMatrix,
            tile,
            layer.paint.get('heatmap-translate'),
            layer.paint.get('heatmap-translate-anchor')),
        'u_pitch_with_map': +(pitchWithMap),
        'u_device_pixel_ratio': devicePixelRatio,
        'u_extrude_scale': extrudeScale,
        'u_intensity': layer.paint.get('heatmap-intensity')
    };
};

const heatmapTextureUniformValues = (
  painter: Painter,
  tile: Tile,
  layer: HeatmapStyleLayer,
  textureUnit: number,
  colorRampUnit: number,
  coord: OverscaledTileID
): UniformValues<HeatmapTextureUniformsType> => {
    const matrix = mat4.create();
    mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);

    const gl = painter.context.gl;
    const align = !painter.options.moving;

    return {
        'u_matrix': coord ? coord.posMatrix : matrix,
        'u_world': [gl.drawingBufferWidth, gl.drawingBufferHeight],
        'u_image': textureUnit,
        'u_color_ramp': colorRampUnit,
        'u_opacity': layer.paint.get('heatmap-opacity')
    };
};

export {
    heatmapUniforms,
    heatmapTextureUniforms,
    heatmapUniformValues,
    heatmapTextureUniformValues
};
