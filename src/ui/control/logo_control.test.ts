import {createMap as globalCreateMap, setWebGlContext} from '../../util/test/util';
import VectorTileSource from '../../source/vector_tile_source';
import Dispatcher from '../../util/dispatcher';
import Map from '../../ui/map';
import Actor from '../../util/actor';
jest.mock('../../util/actor');


function createMap(logoPosition, maplibreLogo) {
    return globalCreateMap({
        logoPosition: logoPosition,
        maplibreLogo: maplibreLogo,
        style: {
            version: 8,
            sources: {},
            layers: []
        }
    }, undefined);
}

const mockDispatcher = (Actor.prototype.send as jest.Mock).mockImplementation(() => { }) as any as Dispatcher;

beforeEach(() => {
    setWebGlContext();
    window.performance.mark = jest.fn();
});

describe('LogoControl', () => {
    test('appears in bottom-left by default', done => {
        const map = createMap(undefined, undefined);
        map.on('load', () => {
            expect(map.getContainer().querySelectorAll(
            '.maplibregl-ctrl-bottom-left .maplibregl-ctrl-logo'
            )).toHaveLength(1);
            done();
        });
    });

    test('appears in the position specified by the position option', done => {
        const map = createMap('top-left', undefined);
        map.on('load', () => {
            expect(map.getContainer().querySelectorAll(
            '.maplibregl-ctrl-top-left .maplibregl-ctrl-logo'
            )).toHaveLength(1);
            done();
        });
    });

    test('is not displayed when the maplibreLogo property is false', done => {
        const map = createMap('top-left', false);
        map.on('load', () => {
            const container = map.getContainer().querySelectorAll('.maplibregl-ctrl-top-left > .maplibregl-ctrl')[0] as HTMLBaseElement;
            const containerStyle = container.style;
            expect(containerStyle).toHaveProperty('display', 'none');
            done();
        });
    });

    test('appears in compact mode if container is less then 250 pixel wide', () => {
        const map = createMap(undefined, undefined);
        const container = map.getContainer();

        Object.defineProperty(map.getCanvasContainer(), 'offsetWidth', {value: 255, configurable: true});
        map.resize();
        expect(
        container.querySelectorAll('.maplibregl-ctrl-logo:not(.maplibregl-compact)')
        ).toHaveLength(1);

        Object.defineProperty(map.getCanvasContainer(), 'offsetWidth', {value: 245, configurable: true});
        map.resize();
        expect(
        container.querySelectorAll('.maplibregl-ctrl-logo.maplibregl-compact')
        ).toHaveLength(1);
    });

    test('has `rel` nooper and nofollow', done => {
        const map = createMap(undefined, undefined);

        map.on('load', () => {
            const container = map.getContainer();
            const logo = container.querySelector('.maplibregl-ctrl-logo');
            expect(logo).toHaveProperty('rel', 'noopener nofollow');
            done();
        });
    });
});
