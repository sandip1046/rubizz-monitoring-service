export declare const config: {
    server: {
        port: number;
        nodeEnv: "development" | "production" | "test";
        serviceName: string;
        serviceVersion: string;
    };
    database: {
        url: string;
    };
    redisService: {
        url: string;
        timeout: number;
        retries: number;
        retryDelay: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    apiGateway: {
        url: string;
        token: string | undefined;
    };
    monitoring: {
        metricsCollectionInterval: number;
        healthCheckInterval: number;
        alertThresholds: {
            cpu: number;
            memory: number;
            disk: number;
            responseTime: number;
        };
    };
    externalServices: {
        prometheus: string | undefined;
        grafana: string | undefined;
        elasticsearch: string | undefined;
    };
    logging: {
        level: "error" | "warn" | "info" | "debug";
        format: "json" | "simple";
        filePath: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    cors: {
        origin: string;
        credentials: boolean;
    };
    swagger: {
        title: string;
        description: string;
        version: string;
        baseUrl: string;
    };
    alerts: {
        email: {
            enabled: boolean;
            smtp: {
                host: string | undefined;
                port: number | undefined;
                user: string | undefined;
                pass: string | undefined;
            };
            from: string | undefined;
            to: string | undefined;
        };
        slack: {
            enabled: boolean;
            webhookUrl: string | undefined;
        };
        pagerduty: {
            enabled: boolean;
            integrationKey: string | undefined;
        };
    };
    serviceDiscovery: {
        enabled: boolean;
        registryUrl: string | undefined;
        checkInterval: string;
        checkTimeout: string;
    };
    grpc: {
        port: number;
        host: string;
    };
    graphql: {
        port: number;
        path: string;
        subscriptionPath: string;
    };
    websocket: {
        port: number;
        path: string;
    };
    kafka: {
        brokers: string[];
        clientId: string;
        groupId: string;
        topics: {
            monitoring: string;
            alerts: string;
            metrics: string;
        };
    };
};
export declare const server: {
    port: number;
    nodeEnv: "development" | "production" | "test";
    serviceName: string;
    serviceVersion: string;
}, database: {
    url: string;
}, redisService: {
    url: string;
    timeout: number;
    retries: number;
    retryDelay: number;
}, jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
}, apiGateway: {
    url: string;
    token: string | undefined;
}, monitoring: {
    metricsCollectionInterval: number;
    healthCheckInterval: number;
    alertThresholds: {
        cpu: number;
        memory: number;
        disk: number;
        responseTime: number;
    };
}, externalServices: {
    prometheus: string | undefined;
    grafana: string | undefined;
    elasticsearch: string | undefined;
}, logging: {
    level: "error" | "warn" | "info" | "debug";
    format: "json" | "simple";
    filePath: string;
}, rateLimit: {
    windowMs: number;
    maxRequests: number;
}, cors: {
    origin: string;
    credentials: boolean;
}, swagger: {
    title: string;
    description: string;
    version: string;
    baseUrl: string;
}, alerts: {
    email: {
        enabled: boolean;
        smtp: {
            host: string | undefined;
            port: number | undefined;
            user: string | undefined;
            pass: string | undefined;
        };
        from: string | undefined;
        to: string | undefined;
    };
    slack: {
        enabled: boolean;
        webhookUrl: string | undefined;
    };
    pagerduty: {
        enabled: boolean;
        integrationKey: string | undefined;
    };
}, serviceDiscovery: {
    enabled: boolean;
    registryUrl: string | undefined;
    checkInterval: string;
    checkTimeout: string;
}, grpc: {
    port: number;
    host: string;
}, graphql: {
    port: number;
    path: string;
    subscriptionPath: string;
}, websocket: {
    port: number;
    path: string;
}, kafka: {
    brokers: string[];
    clientId: string;
    groupId: string;
    topics: {
        monitoring: string;
        alerts: string;
        metrics: string;
    };
};
export declare const DEFAULT_SERVICES: {
    name: string;
    url: string;
    port: number;
}[];
export default config;
//# sourceMappingURL=config.d.ts.map