"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLServer = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const config_1 = require("@/config/config");
const logger_1 = __importDefault(require("@/utils/logger"));
const AlertModel_1 = require("@/models/AlertModel");
const types_1 = require("@/types");
class GraphQLServer {
    constructor() {
        this.server = null;
        this.initializeSchema();
    }
    initializeSchema() {
        try {
            const typeDefs = `
        type Query {
          health: HealthStatus!
          serviceHealth(serviceName: String!): ServiceHealth!
          alerts(
            serviceName: String
            status: AlertStatus
            severity: AlertSeverity
            limit: Int
            offset: Int
          ): AlertsResponse!
          metrics(
            serviceName: String
            startTime: String
            endTime: String
          ): MetricsResponse!
        }

        type Mutation {
          createAlert(input: CreateAlertInput!): Alert!
          acknowledgeAlert(alertId: ID!, acknowledgedBy: String!): Alert!
          resolveAlert(alertId: ID!): Alert!
        }

        type Subscription {
          alertCreated(serviceName: String): Alert!
          metricUpdated(serviceName: String!): Metric!
        }

        type HealthStatus {
          healthy: Boolean!
          status: String!
          timestamp: String!
        }

        type ServiceHealth {
          serviceName: String!
          status: String!
          responseTime: Int
          lastChecked: String!
        }

        type Alert {
          id: ID!
          serviceName: String!
          alertType: String!
          severity: AlertSeverity!
          status: AlertStatus!
          title: String!
          description: String!
          value: Float
          threshold: Float
          createdAt: String!
        }

        type AlertsResponse {
          alerts: [Alert!]!
          total: Int!
        }

        type Metric {
          id: ID!
          serviceName: String!
          metricName: String!
          value: Float!
          timestamp: String!
        }

        type MetricsResponse {
          metrics: [Metric!]!
          total: Int!
        }

        input CreateAlertInput {
          serviceName: String!
          alertType: String!
          severity: AlertSeverity!
          title: String!
          description: String!
          value: Float
          threshold: Float
        }

        enum AlertStatus {
          ACTIVE
          RESOLVED
          ACKNOWLEDGED
          SUPPRESSED
        }

        enum AlertSeverity {
          LOW
          MEDIUM
          HIGH
          CRITICAL
        }
      `;
            const resolvers = {
                Query: {
                    health: () => ({
                        healthy: true,
                        status: 'OK',
                        timestamp: new Date().toISOString(),
                    }),
                    serviceHealth: async (_, { serviceName }) => {
                        return {
                            serviceName,
                            status: 'HEALTHY',
                            responseTime: 100,
                            lastChecked: new Date().toISOString(),
                        };
                    },
                    alerts: async (_, args) => {
                        const alerts = await AlertModel_1.AlertModel.findByService(args.serviceName || '', args.status, args.limit || 100, args.offset || 0);
                        return {
                            alerts: alerts.map(alert => ({
                                ...alert,
                                id: alert.id,
                                createdAt: new Date().toISOString(),
                            })),
                            total: alerts.length,
                        };
                    },
                    metrics: () => ({
                        metrics: [],
                        total: 0,
                    }),
                },
                Mutation: {
                    createAlert: async (_, { input }) => {
                        const alert = await AlertModel_1.AlertModel.create({
                            serviceName: input.serviceName,
                            alertType: input.alertType,
                            severity: input.severity,
                            status: types_1.AlertStatus.ACTIVE,
                            title: input.title,
                            description: input.description,
                            value: input.value,
                            threshold: input.threshold,
                        });
                        return {
                            ...alert,
                            createdAt: new Date().toISOString(),
                        };
                    },
                    acknowledgeAlert: async (_, { alertId, acknowledgedBy }) => {
                        return await AlertModel_1.AlertModel.acknowledge(alertId, acknowledgedBy);
                    },
                    resolveAlert: async (_, { alertId }) => {
                        return await AlertModel_1.AlertModel.resolve(alertId);
                    },
                },
                Subscription: {
                    alertCreated: {
                        subscribe: () => {
                            return null;
                        },
                    },
                    metricUpdated: {
                        subscribe: () => {
                            return null;
                        },
                    },
                },
            };
            this.server = new apollo_server_express_1.ApolloServer({
                typeDefs,
                resolvers,
                introspection: config_1.config.server.nodeEnv !== 'production',
            });
            logger_1.default.info('GraphQL server initialized');
        }
        catch (error) {
            logger_1.default.error('Failed to initialize GraphQL server', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    getServer() {
        return this.server;
    }
    async start(app) {
        if (!this.server) {
            throw new Error('GraphQL server not initialized');
        }
        await this.server.start();
        this.server.applyMiddleware({
            app,
            path: config_1.config.graphql.path,
        });
        logger_1.default.info('GraphQL server started', {
            path: config_1.config.graphql.path,
        });
    }
    async stop() {
        if (this.server) {
            await this.server.stop();
            logger_1.default.info('GraphQL server stopped');
        }
    }
}
exports.GraphQLServer = GraphQLServer;
//# sourceMappingURL=graphql.server.js.map