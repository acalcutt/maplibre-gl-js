type Config = {
    MAX_PARALLEL_IMAGE_REQUESTS: number;
    REGISTERED_PROTOCOLS: { [x: string]: any };
    API_URL: string;
    EVENTS_URL: string;
    FEEDBACK_URL: string;
    REQUIRE_ACCESS_TOKEN: boolean;
    ACCESS_TOKEN: string;
    TRAFFIC_SOURCE: Object;
    DEBUG: boolean
};

const config: Config = {
    MAX_PARALLEL_IMAGE_REQUESTS: 16,
    REGISTERED_PROTOCOLS: {},
    API_URL: 'http://121.36.99.212:35001', // api_config.API_URL
    get EVENTS_URL() {
        if (!this.API_URL) { return null; }
        if (this.API_URL.indexOf('https://api.mapabc.cn') === 0) {
            return 'https://events.mapabc.cn/events/v2';
        } else if (this.API_URL.indexOf('https://api.mapabc.com') === 0) {
            return 'https://events.mapabc.com/events/v2';
        } else {
            return null;
        }
    },
    FEEDBACK_URL: 'https://apps.mapabc.com/feedback',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: null,
    TRAFFIC_SOURCE: {}, // api_config.traffic_source
    DEBUG: false
};

export default config;
