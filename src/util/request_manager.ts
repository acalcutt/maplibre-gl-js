import config from './config';
import {IResourceType} from './ajax';

import type {RequestParameters} from './ajax';

type ResourceTypeEnum = keyof IResourceType;
export type RequestTransformFunction = (url: string, resourceType?: ResourceTypeEnum) => RequestParameters;

type UrlObject = {
  protocol: string;
  authority: string;
  path: string;
  params: Array<string>;
};

export class RequestManager {
    _transformRequestFn: RequestTransformFunction;
    _customAccessToken: string;

    constructor(transformRequestFn?: RequestTransformFunction, customAccessToken?: string) {
        this._transformRequestFn = transformRequestFn;
        this._customAccessToken = customAccessToken;
    }

    transformRequest(url: string, type: ResourceTypeEnum) {
        if (this._transformRequestFn) {
            return this._transformRequestFn(url, type) || {url};
        }

        return {url};
    }

    normalizeSpriteURL(url: string, format: string, extension: string, accessToken?: string): string {
        const urlObject = parseUrl(url);
        if (!isMapabcURL(url)) {
            urlObject.path += `${format}${extension}`;
            return formatUrl(urlObject);
        }
        //urlObject.path = `/styles/v1${urlObject.path}/sprite${format}${extension}`;
        /**
        modify sprite file url for msp
        **/
        urlObject.path = urlObject.path.replace(/\//g, '');
        extension = extension.replace(/\./g, '');

        urlObject.params.push(`n=${urlObject.path}${format}`);
        urlObject.params.push(`e=${extension}`);
        urlObject.path = '/webglapi/sprite';

        return this._makeAPIURL(urlObject, this._customAccessToken || accessToken);
    }

    setTransformRequest(transformRequest: RequestTransformFunction) {
        this._transformRequestFn = transformRequest;
    }

    normalizeStyleURL(url: string, accessToken?: string): string {
        if (!isMapabcURL(url)) return url;
        const urlObject = parseUrl(url);
        // urlObject.path = `/styles/v1${urlObject.path}`;
        urlObject.path = urlObject.path.replace(/\//g, '');
        urlObject.params.push(`n=${urlObject.path}`);
        //添加默认参数
        const hasAddSourceParam = urlObject.params.filter((ele) => {
            if (ele.indexOf('addSource') === -1) {
                return false;
            }
            return true;
        });
        //添加默认参数
        const hasSourceTypeParam = urlObject.params.filter((ele) => {
            if (ele.indexOf('sourceType') === -1) {
                return false;
            }
            return true;
        });
        if (hasAddSourceParam.length === 0) {
            urlObject.params.push('addSource=true');
        }
        if (hasSourceTypeParam.length === 0) {
            urlObject.params.push('sourceType=http');
        }
        urlObject.path = '/webglapi/styles';
        return this._makeAPIURL(urlObject, this._customAccessToken || accessToken);
    }

    _makeAPIURL(urlObject: UrlObject, accessToken: string | null | void): string {
        const help = 'See https://www.mapabc.com/api-documentation/#access-tokens-and-token-scopes';
        const apiUrlObject = parseUrl(config.API_URL);
        urlObject.protocol = apiUrlObject.protocol;
        urlObject.authority = apiUrlObject.authority;

        if (urlObject.protocol === 'http') {
            const i = urlObject.params.indexOf('secure');
            if (i >= 0) urlObject.params.splice(i, 1);
        }

        if (apiUrlObject.path !== '/') {
            urlObject.path = `${apiUrlObject.path}${urlObject.path}`;
        }

        if (!config.REQUIRE_ACCESS_TOKEN) return formatUrl(urlObject);

        accessToken = accessToken || config.ACCESS_TOKEN;
        if (!accessToken)
            throw new Error(`An API access token is required to use Mapabc GL. ${help}`);
        if (accessToken[0] === 's')
            throw new Error(`Use a public access token (pk.*) with Mapabc GL, not a secret access token (sk.*). ${help}`);

        urlObject.params = urlObject.params.filter((d) => d.indexOf('ak') === -1);
        urlObject.params.push(`ak=${accessToken}`);
        return formatUrl(urlObject);
    }

    normalizeGlyphsURL(url: string, accessToken?: string): string {
        if (!isMapabcURL(url)) return url;
        const urlObject = parseUrl(url);
        //urlObject.path = `/fonts/v1${urlObject.path}`;
        urlObject.path = '/webglapi/fonts';
        urlObject.params.push('n={fontstack}');
        urlObject.params.push('r={range}');
        return this._makeFontAPIURL(urlObject, this._customAccessToken || accessToken);
    }

    _makeFontAPIURL(urlObject: UrlObject, accessToken: string | null | void): string {
        const help = 'See https://www.mapabc.com/api-documentation/#access-tokens-and-token-scopes';
        const apiUrlObject = parseUrl(config.API_URL);
        urlObject.protocol = apiUrlObject.protocol;
        urlObject.authority = apiUrlObject.authority;

        if (apiUrlObject.path !== '/') {
            urlObject.path = `${apiUrlObject.path}${urlObject.path}`;
        }

        if (!config.REQUIRE_ACCESS_TOKEN) return formatUrl(urlObject);

        accessToken = accessToken || config.ACCESS_TOKEN;
        if (!accessToken)
            throw new Error(`An API access token is required to use Mapabc GL. ${help}`);
        if (accessToken[0] === 's')
            throw new Error(`Use a public access token (pk.*) with Mapabc GL, not a secret access token (sk.*). ${help}`);

        urlObject.params = urlObject.params.filter((d) => d.indexOf('ak') === -1);
        urlObject.params.push(`ak=${accessToken}`);
        return formatUrl(urlObject);
    }
}

const urlRe = /^(\w+):\/\/([^/?]*)(\/[^?]+)?\??(.+)?/;

function parseUrl(url: string): UrlObject {
    const parts = url.match(urlRe);
    if (!parts) {
        throw new Error(`Unable to parse URL "${url}"`);
    }
    return {
        protocol: parts[1],
        authority: parts[2],
        path: parts[3] || '/',
        params: parts[4] ? parts[4].split('&') : []
    };
}

function formatUrl(obj: UrlObject): string {
    const params = obj.params.length ? `?${obj.params.join('&')}` : '';
    return `${obj.protocol}://${obj.authority}${obj.path}${params}`;
}

function isMapabcURL(url: string) {
    return url.indexOf('mapabc:') === 0;
}

export {isMapabcURL};
