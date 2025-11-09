import { ApolloServer } from 'apollo-server-express';
import { config } from '@/config/config';
import logger from '@/utils/logger';
import { AlertModel } from '@/models/AlertModel';
import { AlertSeverity, AlertStatus } from '@/types';

export class GraphQLServer {
  private server: ApolloServer | null = null;

  constructor() {
    this.initializeSchema();
  }

  private initializeSchema(): void {
    try {
      // Simple GraphQL schema for monitoring
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
          serviceHealth: async (_: any, { serviceName }: { serviceName: string }) => {
            return {
              serviceName,
              status: 'HEALTHY',
              responseTime: 100,
              lastChecked: new Date().toISOString(),
            };
          },
          alerts: async (
            _: any,
            args: {
              serviceName?: string;
              status?: AlertStatus;
              severity?: AlertSeverity;
              limit?: number;
              offset?: number;
            }
          ) => {
            const alerts = await AlertModel.findByService(
              args.serviceName || '',
              args.status,
              args.limit || 100,
              args.offset || 0
            );
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
          createAlert: async (_: any, { input }: { input: any }) => {
            const alert = await AlertModel.create({
              serviceName: input.serviceName,
              alertType: input.alertType,
              severity: input.severity,
              status: AlertStatus.ACTIVE,
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
          acknowledgeAlert: async (
            _: any,
            { alertId, acknowledgedBy }: { alertId: string; acknowledgedBy: string }
          ) => {
            return await AlertModel.acknowledge(alertId, acknowledgedBy);
          },
          resolveAlert: async (_: any, { alertId }: { alertId: string }) => {
            return await AlertModel.resolve(alertId);
          },
        },
        Subscription: {
          alertCreated: {
            subscribe: () => {
              // WebSocket subscription implementation
              return null as any;
            },
          },
          metricUpdated: {
            subscribe: () => {
              // WebSocket subscription implementation
              return null as any;
            },
          },
        },
      };

      this.server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: config.server.nodeEnv !== 'production',
      });

      logger.info('GraphQL server initialized');
    } catch (error) {
      logger.error('Failed to initialize GraphQL server', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public getServer(): ApolloServer | null {
    return this.server;
  }

  public async start(app: any): Promise<void> {
    if (!this.server) {
      throw new Error('GraphQL server not initialized');
    }

    await this.server.start();
    this.server.applyMiddleware({
      app,
      path: config.graphql.path,
    });

    logger.info('GraphQL server started', {
      path: config.graphql.path,
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      logger.info('GraphQL server stopped');
    }
  }
}

