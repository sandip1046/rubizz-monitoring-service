# Rubizz Monitoring Service

Enterprise-grade monitoring and observability service for the Rubizz Hotel Inn microservices ecosystem. Built with multi-protocol support (REST, gRPC, GraphQL, WebSocket) and event-driven architecture (Kafka) for enterprise-scale monitoring.

## 🚀 Features

### Core Monitoring Capabilities
- ✅ **Health Checks**: Automated health monitoring of all microservices
- ✅ **Metrics Collection**: System and performance metrics gathering
- ✅ **Alerting**: Real-time alert generation and multi-channel notifications
- ✅ **Performance Monitoring**: Request/response time tracking and analysis
- ✅ **Service Discovery**: Automatic service registration and monitoring
- ✅ **Real-time Updates**: WebSocket-based live monitoring
- ✅ **Event-Driven**: Kafka integration for scalable event processing

### Multi-Protocol Support
- ✅ **REST API**: Standard HTTP/REST endpoints for web clients
- ✅ **gRPC**: High-performance internal service communication (1-5ms latency)
- ✅ **GraphQL**: Flexible querying and real-time subscriptions
- ✅ **WebSocket**: Real-time monitoring updates and live dashboards
- ✅ **Kafka**: Event-driven monitoring and alert distribution

### Enterprise Features
- ✅ **MongoDB**: Scalable document storage with automatic TTL cleanup
- ✅ **Redis Integration**: Centralized Redis service for caching and sessions
- ✅ **Prometheus Integration**: Metrics export for Prometheus scraping
- ✅ **Grafana Ready**: Pre-configured dashboards and data sources
- ✅ **Elasticsearch**: Log search and analytics integration
- ✅ **Docker Support**: Local Docker-based monitoring stack

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Protocols](#protocols)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring Stack](#monitoring-stack)

## 🏗️ Architecture

### Communication Protocols

| Protocol | Port | Use Case | Performance |
|----------|------|----------|-------------|
| **REST** | 3009 | Web clients, API Gateway | 10-50ms |
| **gRPC** | 50051 | Internal service-to-service | 1-5ms |
| **GraphQL** | 3009 | Flexible queries, subscriptions | 10-50ms |
| **WebSocket** | 8080 | Real-time updates | 1-5ms |
| **Kafka** | 9092 | Event streaming | 5-20ms |

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Centralized Redis Service (https://rubizz-redis-service.onrender.com)
- **Event Streaming**: Apache Kafka
- **Monitoring Stack**: Prometheus + Grafana + Elasticsearch (Docker)

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Docker & Docker Compose (for monitoring stack)
- Kafka (optional, for event-driven features)

### Setup

1. **Install Dependencies**
```bash
cd Server/rubizz-monitoring-service
npm install
```

2. **Environment Configuration**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start Monitoring Stack (Docker)**
```bash
# Start Prometheus, Grafana, Elasticsearch
docker-compose up -d

# Verify services are running
docker ps
```

4. **Start the Service**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## ⚙️ Configuration

### Environment Variables

#### Server Configuration
```env
PORT=3009
NODE_ENV=development
SERVICE_NAME=rubizz-monitoring-service
SERVICE_VERSION=1.0.0
```

#### Database Configuration
```env
# MongoDB Connection String
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/rubizz-monitoring"
# OR for local MongoDB
DATABASE_URL="mongodb://localhost:27017/rubizz-monitoring"
```

#### Redis Service Configuration
```env
# Centralized Redis Service
REDIS_SERVICE_URL=https://rubizz-redis-service.onrender.com/api/v1/redis
REDIS_SERVICE_TIMEOUT=30000
REDIS_SERVICE_RETRIES=3
REDIS_SERVICE_RETRY_DELAY=1000
```

#### Protocol Configuration
```env
# gRPC
GRPC_PORT=50051
GRPC_HOST=0.0.0.0

# GraphQL
GRAPHQL_PORT=4000
GRAPHQL_PATH=/graphql
GRAPHQL_SUBSCRIPTION_PATH=/graphql-subscriptions

# WebSocket
WEBSOCKET_PORT=8080
WEBSOCKET_PATH=/ws

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=rubizz-monitoring-service
KAFKA_GROUP_ID=monitoring-service-group
KAFKA_TOPICS_MONITORING=monitoring.events
KAFKA_TOPICS_ALERTS=monitoring.alerts
KAFKA_TOPICS_METRICS=monitoring.metrics
```

#### Monitoring Stack (Docker)
```env
PROMETHEUS_ENDPOINT=http://localhost:9090
GRAFANA_ENDPOINT=http://localhost:6001
ELASTICSEARCH_ENDPOINT=http://localhost:9200
```

#### Alert Configuration
```env
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5000

# Email
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USER=your-email@gmail.com
ALERT_EMAIL_PASS=your-app-password

# Slack
ALERT_SLACK_ENABLED=false
ALERT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# PagerDuty
ALERT_PAGERDUTY_ENABLED=false
ALERT_PAGERDUTY_INTEGRATION_KEY=your-key
```

## 🔌 Protocols

### REST API

Standard HTTP/REST endpoints for web clients and API Gateway integration.

**Base URL**: `http://localhost:3009`

**Health Check**:
```bash
GET /health
GET /health/detailed
GET /health/service/:serviceName
```

**Metrics**:
```bash
GET /metrics/system
GET /metrics/performance
GET /metrics/:serviceName/summary
POST /metrics/record
```

**Alerts**:
```bash
GET /alerts/active
GET /alerts/critical
GET /alerts/service/:serviceName
POST /alerts
POST /alerts/:alertId/acknowledge
POST /alerts/:alertId/resolve
```

**API Documentation**: `http://localhost:3009/api-docs`

### gRPC API

High-performance internal service communication using Protocol Buffers.

**Port**: `50051`

**Proto Definition**: `src/proto/monitoring.proto`

**Example gRPC Client**:
```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('monitoring.proto');
const monitoringProto = grpc.loadPackageDefinition(packageDefinition) as any;

const client = new monitoringProto.monitoring.MonitoringService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Get health
client.GetHealth({}, (error: any, response: any) => {
  console.log('Health:', response);
});

// Get alerts
client.GetAlerts({
  service_name: 'rubizz-hotel-service',
  limit: 10
}, (error: any, response: any) => {
  console.log('Alerts:', response.alerts);
});

// Stream metrics
const call = client.StreamMetrics({ service_name: 'rubizz-hotel-service' });
call.on('data', (metric: any) => {
  console.log('Metric update:', metric);
});
```

**Available gRPC Methods**:
- `GetHealth()` - Service health check
- `GetServiceHealth()` - Service-specific health
- `GetSystemMetrics()` - System metrics query
- `GetPerformanceMetrics()` - Performance metrics query
- `RecordMetric()` - Record custom metric
- `GetAlerts()` - Query alerts
- `CreateAlert()` - Create new alert
- `AcknowledgeAlert()` - Acknowledge alert
- `ResolveAlert()` - Resolve alert
- `StreamMetrics()` - Real-time metrics stream
- `StreamAlerts()` - Real-time alerts stream

### GraphQL API

Flexible querying and real-time subscriptions for monitoring data.

**Endpoint**: `http://localhost:3009/graphql`

**GraphQL Playground**: `http://localhost:3009/graphql` (development only)

**Example Queries**:
```graphql
# Health Check
query {
  health {
    healthy
    status
    timestamp
  }
}

# Service Health
query {
  serviceHealth(serviceName: "rubizz-hotel-service") {
    serviceName
    status
    responseTime
    lastChecked
  }
}

# Alerts
query {
  alerts(
    serviceName: "rubizz-hotel-service"
    status: ACTIVE
    severity: CRITICAL
    limit: 10
  ) {
    alerts {
      id
      title
      severity
      status
      createdAt
    }
    total
  }
}

# Create Alert
mutation {
  createAlert(input: {
    serviceName: "rubizz-hotel-service"
    alertType: "high_cpu"
    severity: HIGH
    title: "High CPU Usage"
    description: "CPU usage exceeded threshold"
    value: 85.5
    threshold: 80.0
  }) {
    id
    status
  }
}
```

**Subscriptions**:
```graphql
subscription {
  alertCreated(serviceName: "rubizz-hotel-service") {
    id
    title
    severity
    createdAt
  }
}

subscription {
  metricUpdated(serviceName: "rubizz-hotel-service") {
    id
    metricName
    value
    timestamp
  }
}
```

### WebSocket API

Real-time monitoring updates for live dashboards.

**Endpoint**: `ws://localhost:8080/ws`

**Connection Example**:
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected to monitoring service');
  
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    serviceName: 'rubizz-hotel-service',
    metricNames: ['cpu_usage', 'memory_usage'],
    alertSeverity: 'CRITICAL'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'connected':
      console.log('Connection confirmed');
      break;
    case 'metric':
      console.log('Metric update:', data.data);
      break;
    case 'alert':
      console.log('Alert:', data.data.alert);
      break;
    case 'pong':
      console.log('Ping response');
      break;
  }
};

// Send ping
ws.send(JSON.stringify({ type: 'ping' }));

// Unsubscribe
ws.send(JSON.stringify({ type: 'unsubscribe' }));
```

**Message Types**:
- `subscribe` - Subscribe to metric/alert updates
- `unsubscribe` - Unsubscribe from updates
- `ping` - Keep-alive ping

**Event Types**:
- `connected` - Connection established
- `metric` - Metric update
- `alert` - Alert notification
- `pong` - Ping response
- `error` - Error message

### Kafka Integration

Event-driven monitoring and alert distribution.

**Topics**:
- `monitoring.events` - General monitoring events
- `monitoring.alerts` - Alert events
- `monitoring.metrics` - Metric events

**Publishing Events**:
```typescript
import { KafkaService } from '@/services/KafkaService';

const kafkaService = new KafkaService();
await kafkaService.connect();

// Publish monitoring event
await kafkaService.publishMonitoringEvent('service.health.changed', {
  serviceName: 'rubizz-hotel-service',
  status: 'UNHEALTHY',
  responseTime: 5000
});

// Publish alert
await kafkaService.publishAlert({
  id: 'alert-123',
  serviceName: 'rubizz-hotel-service',
  alertType: 'high_cpu',
  severity: 'CRITICAL',
  title: 'High CPU Usage',
  description: 'CPU usage is 95%'
});

// Publish metric
await kafkaService.publishMetric({
  serviceName: 'rubizz-hotel-service',
  metricName: 'cpu_usage',
  value: 95.5,
  timestamp: new Date()
});
```

**Consuming Events**:
The service automatically consumes events from Kafka topics and processes them:
- `monitoring.events` → Service health updates
- `monitoring.alerts` → Alert creation from other services
- `monitoring.metrics` → Metric ingestion from other services

## 🗄️ Database

### MongoDB Schema

The service uses MongoDB with Mongoose ODM. All collections have automatic TTL indexes for data cleanup.

#### Collections

1. **service_health** - Service health status records
2. **alerts** - Alert records
3. **system_metrics** - System metrics (TTL: 30 days)
4. **performance_metrics** - Performance metrics (TTL: 30 days)
5. **resource_metrics** - Resource usage metrics (TTL: 30 days)

#### Indexes

All collections have optimized indexes for:
- Service name queries
- Time-range queries
- Status/severity filtering
- Compound queries

#### Data Retention

- **Metrics**: 30 days (automatic TTL cleanup)
- **Alerts**: Configurable (default: resolved alerts kept for 30 days)
- **Health Records**: Latest record per service (old records cleaned up)

## 📊 Monitoring Stack

### Docker Services

The service integrates with a local Docker-based monitoring stack:

#### Prometheus (Port 9090)
- Metrics collection and storage
- Scrapes metrics from all services
- Alert rule evaluation
- **Access**: http://localhost:9090

#### Grafana (Port 6001)
- Visualization and dashboards
- Pre-configured Prometheus data source
- Custom dashboard support
- **Access**: http://localhost:6001
- **Credentials**: admin/admin

#### Elasticsearch (Port 9200)
- Log search and analytics
- Full-text search capabilities
- **Access**: http://localhost:9200

### Starting the Stack

```bash
cd Server/rubizz-monitoring-service
docker-compose up -d
```

### Verifying Services

```bash
# Check container status
docker ps

# View logs
docker-compose logs -f

# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Grafana
curl http://localhost:6001/api/health

# Check Elasticsearch
curl http://localhost:9200/_cluster/health
```

## 🔌 API Endpoints

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/detailed` | Detailed health with dependencies |
| `GET` | `/health/service/:serviceName` | Service-specific health |
| `GET` | `/health/service/:serviceName/summary` | Service health summary |
| `GET` | `/health/status/:status` | Services by status |
| `POST` | `/health/check` | Check custom service |
| `POST` | `/health/start` | Start health monitoring |
| `POST` | `/health/stop` | Stop health monitoring |

### Metrics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/metrics/system` | System metrics |
| `GET` | `/metrics/performance` | Performance metrics |
| `GET` | `/metrics/performance/:serviceName/summary` | Performance summary |
| `GET` | `/metrics/:serviceName/summary` | Service metrics summary |
| `POST` | `/metrics/record` | Record custom metric |
| `GET` | `/metrics/performance/:serviceName/slowest` | Slowest endpoints |
| `GET` | `/metrics/performance/:serviceName/error-rates` | Error rates |
| `POST` | `/metrics/start` | Start metrics collection |
| `POST` | `/metrics/stop` | Stop metrics collection |

### Alert Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts/active` | Active alerts |
| `GET` | `/alerts/critical` | Critical alerts |
| `GET` | `/alerts/service/:serviceName` | Service alerts |
| `GET` | `/alerts/summary` | Alerts summary |
| `GET` | `/alerts/trends` | Alert trends over time |
| `GET` | `/alerts/:alertId` | Get alert by ID |
| `POST` | `/alerts` | Create alert |
| `POST` | `/alerts/:alertId/acknowledge` | Acknowledge alert |
| `POST` | `/alerts/:alertId/resolve` | Resolve alert |
| `POST` | `/alerts/test-notification` | Send test notification |
| `GET` | `/alerts/notification-status` | Notification channel status |
| `POST` | `/alerts/start` | Start alert service |
| `POST` | `/alerts/stop` | Stop alert service |

## 🛠️ Development

### Project Structure

```
src/
├── config/              # Configuration management
│   └── config.ts        # Environment config with protocol settings
├── controllers/         # REST API controllers
├── database/            # MongoDB connection
│   └── connection.ts   # Mongoose connection
├── models/              # Data models
│   ├── mongoose/        # Mongoose schemas
│   │   ├── Alert.ts
│   │   ├── ServiceHealth.ts
│   │   ├── SystemMetric.ts
│   │   └── PerformanceMetric.ts
│   ├── AlertModel.ts    # Alert model (Mongoose-based)
│   └── ...              # Other models
├── servers/             # Protocol servers
│   ├── grpc.server.ts  # gRPC server
│   ├── graphql.server.ts # GraphQL server
│   └── websocket.server.ts # WebSocket server
├── services/            # Business logic
│   ├── KafkaService.ts  # Kafka integration
│   ├── RedisService.ts  # Redis integration
│   ├── HealthCheckService.ts
│   ├── MetricsCollectionService.ts
│   └── AlertService.ts
├── proto/               # Protocol Buffers
│   └── monitoring.proto # gRPC service definition
├── middleware/          # Express middleware
├── types/               # TypeScript types
└── index.ts            # Application entry point
```

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build           # Build for production
npm start               # Start production server

# Protocol Generation
npm run proto:generate  # Generate gRPC TypeScript types

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Linting
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
```

### Adding New Metrics

```typescript
import { SystemMetricsModel } from '@/models/SystemMetricsModel';

// Record metric
await SystemMetricsModel.create({
  serviceName: 'rubizz-hotel-service',
  metricName: 'custom_metric',
  metricType: MetricType.GAUGE,
  value: 100,
  labels: { environment: 'production' }
});
```

### Adding New Alert Rules

```typescript
import { AlertService } from '@/services/AlertService';

const alertService = AlertService.getInstance();

// Custom alert check
if (metricValue > threshold) {
  await alertService.createAlert({
    serviceName: 'rubizz-hotel-service',
    alertType: 'custom_metric_high',
    severity: AlertSeverity.HIGH,
    title: 'Custom Metric High',
    description: `Metric value ${metricValue} exceeds threshold ${threshold}`,
    value: metricValue,
    threshold: threshold
  });
}
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3009 50051 8080

CMD ["npm", "start"]
```

### Environment Variables

Ensure all required environment variables are set:
- `DATABASE_URL` - MongoDB connection string
- `REDIS_SERVICE_URL` - Centralized Redis service URL
- `JWT_SECRET` - JWT secret key
- `KAFKA_BROKERS` - Kafka broker addresses (if using Kafka)

### Health Checks

The service exposes health check endpoints for orchestration platforms:

```yaml
# Kubernetes health checks
livenessProbe:
  httpGet:
    path: /health
    port: 3009
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3009
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📈 Enterprise Readiness

### Scalability

- **Horizontal Scaling**: Stateless design allows multiple instances
- **Database**: MongoDB sharding support for large-scale deployments
- **Caching**: Redis for fast metric lookups
- **Event Streaming**: Kafka for distributed event processing

### Performance

- **gRPC**: 1-5ms latency for internal calls
- **WebSocket**: Real-time updates with <100ms latency
- **MongoDB Indexes**: Optimized for time-series queries
- **TTL Cleanup**: Automatic data retention management

### Reliability

- **Health Checks**: Automated service monitoring
- **Alerting**: Multi-channel notifications
- **Graceful Shutdown**: Clean resource cleanup
- **Error Handling**: Comprehensive error recovery

### Security

- **JWT Authentication**: Secure API access
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Request validation and sanitization

## 🔍 Monitoring Integration

### Prometheus Metrics

The service exposes Prometheus-compatible metrics at `/metrics`:

```bash
curl http://localhost:3009/metrics
```

### Grafana Dashboards

Pre-configured Grafana dashboards are available in:
- `monitoring/grafana/dashboards/`

### Elasticsearch Logs

Logs are structured JSON and can be sent to Elasticsearch for analysis.

## 🆘 Troubleshooting

### Service Won't Start

1. Check MongoDB connection:
```bash
# Test MongoDB connection
mongosh "your-connection-string"
```

2. Verify Redis service:
```bash
curl https://rubizz-redis-service.onrender.com/api/v1/redis/health
```

3. Check environment variables:
```bash
cat .env
```

### Protocol Servers Not Starting

- **gRPC**: Check port 50051 availability
- **GraphQL**: Verify Apollo Server initialization
- **WebSocket**: Check port 8080 availability
- **Kafka**: Verify Kafka brokers are accessible

### Database Issues

- Check MongoDB connection string format
- Verify network connectivity
- Check MongoDB indexes are created
- Review Mongoose connection logs

## 📚 Additional Resources

- **API Documentation**: http://localhost:3009/api-docs
- **GraphQL Playground**: http://localhost:3009/graphql
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:6001
- **Elasticsearch**: http://localhost:9200

## 🤝 Integration with Other Services

All Rubizz microservices can integrate with the monitoring service via:

- **REST API**: Standard HTTP calls
- **gRPC**: High-performance internal calls
- **GraphQL**: Flexible queries
- **WebSocket**: Real-time subscriptions
- **Kafka**: Event-driven integration

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- **Email**: support@rubizzhotel.com
- **Documentation**: See `monitoring/README.md` for monitoring stack setup

---

**Rubizz Monitoring Service** - Enterprise-grade monitoring with multi-protocol support for the Rubizz Hotel Inn ecosystem.

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Enterprise Scale**: ✅ Ready for large-scale deployments
