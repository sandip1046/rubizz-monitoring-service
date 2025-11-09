import { ApolloServer } from 'apollo-server-express';
export declare class GraphQLServer {
    private server;
    constructor();
    private initializeSchema;
    getServer(): ApolloServer | null;
    start(app: any): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=graphql.server.d.ts.map