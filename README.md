# Rubizz Monitoring Service

A comprehensive monitoring and observability service for the Rubizz Hotel Inn microservices ecosystem. This service provides health checks, metrics collection, alerting, and performance monitoring capabilities.

## 🚀 Features

### Core Monitoring Capabilities
- **Health Checks**: Automated health monitoring of all microservices
- **Metrics Collection**: System and performance metrics gathering
- **Alerting**: Real-time alert generation and notification
- **Performance Monitoring**: Request/response time tracking
- **Service Discovery**: Automatic service registration and monitoring

### Key Features
- **Real-time Monitoring**: Live health status and metrics
- **Multi-channel Alerts**: Email, Slack, and PagerDuty notifications
- **Performance Analytics**: Response time analysis and trending
- **Service Dependencies**: Track service relationships and dependencies
- **Dashboard Ready**: Data prepared for visualization dashboards
- **Scalable Architecture**: Built for enterprise-level monitoring

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Health Checks](#health-checks)
- [Metrics Collection](#metrics-collection)
- [Alerting System](#alerting-system)
- [Database Schema](#database-schema)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm 8+

### Setup

1. **Clone and Install Dependencies**
```bash
cd rubizz-monitoring-service
npm install
```

2. **Environment Configuration**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed initial data
npm run prisma:studio
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

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | 3009 | No |
| `NODE_ENV` | Environment | development | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_HOST` | Redis host | localhost | No |
| `REDIS_PORT` | Redis port | 6379 | No |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `METRICS_COLLECTION_INTERVAL` | Metrics collection interval (ms) | 30000 | No |
| `HEALTH_CHECK_INTERVAL` | Health check interval (ms) | 60000 | No |

### Alert Thresholds
```env
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5000
```

### Notification Channels
```env
# Email
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USER=your-email@gmail.com
ALERT_EMAIL_PASS=your-app-password

# Slack
ALERT_SLACK_ENABLED=true
ALERT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# PagerDuty
ALERT_PAGERDUTY_ENABLED=true
ALERT_PAGERDUTY_INTEGRATION_KEY=your-pagerduty-key
```

## 🔌 API Endpoints

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Basic health check |
| `GET` | `/health/detailed` | Detailed health status |
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
| `GET` | `/metrics/performance/:serviceName/error-rates` | Error rates by endpoint |

### Alert Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts/active` | Active alerts |
| `GET` | `/alerts/critical` | Critical alerts |
| `GET` | `/alerts/service/:serviceName` | Service alerts |
| `GET` | `/alerts/summary` | Alerts summary |
| `GET` | `/alerts/trends` | Alert trends |
| `POST` | `/alerts` | Create alert |
| `POST` | `/alerts/:alertId/acknowledge` | Acknowledge alert |
| `POST` | `/alerts/:alertId/resolve` | Resolve alert |
| `POST` | `/alerts/test-notification` | Send test notification |

## 🏥 Health Checks

### Service Health Monitoring

The monitoring service automatically checks the health of all configured services:

```typescript
// Default monitored services
const DEFAULT_SERVICES = [
  { name: 'rubizz-api-gateway', url: 'http://localhost:3000/health', port: 3000 },
  { name: 'rubizz-auth-service', url: 'http://localhost:3001/health', port: 3001 },
  // ... more services
];
```

### Health Check Response

```json
{
  "status": "healthy",
  "serviceName": "rubizz-monitoring-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": 45,
  "details": {
    "version": "1.0.0",
    "uptime": 3600,
    "memory": {
      "used": 52428800,
      "total": 1073741824,
      "percentage": 4.88
    },
    "cpu": {
      "usage": 15.5,
      "load": [1.2, 1.5, 1.8]
    },
    "database": {
      "connected": true,
      "responseTime": 12
    },
    "redis": {
      "connected": true,
      "responseTime": 8
    }
  }
}
```

### Custom Health Checks

```bash
curl -X POST http://localhost:3009/health/check \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "custom-service",
    "serviceUrl": "http://custom-service:8080/health",
    "timeout": 10000
  }'
```

## 📊 Metrics Collection

### System Metrics

Automatically collected system metrics include:

- **CPU Usage**: Current CPU utilization percentage
- **Memory Usage**: RAM usage and available memory
- **Disk Usage**: Disk space utilization
- **Network I/O**: Network input/output statistics
- **Process Metrics**: Node.js process-specific metrics

### Performance Metrics

Request-level performance tracking:

- **Response Time**: End-to-end request processing time
- **Status Codes**: HTTP response status distribution
- **Request/Response Size**: Data transfer metrics
- **Endpoint Performance**: Per-endpoint performance analysis

### Custom Metrics

Record custom business metrics:

```bash
curl -X POST http://localhost:3009/metrics/record \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "rubizz-hotel-service",
    "metricName": "bookings_per_hour",
    "value": 25,
    "metricType": "GAUGE",
    "labels": {
      "room_type": "deluxe",
      "season": "peak"
    }
  }'
```

### Metrics Query Examples

```bash
# Get system metrics for last hour
curl "http://localhost:3009/metrics/system?serviceName=rubizz-hotel-service&startTime=2024-01-15T09:00:00Z&endTime=2024-01-15T10:00:00Z"

# Get performance summary
curl "http://localhost:3009/metrics/performance/rubizz-hotel-service/summary?startTime=2024-01-15T09:00:00Z&endTime=2024-01-15T10:00:00Z"

# Get slowest endpoints
curl "http://localhost:3009/metrics/performance/rubizz-hotel-service/slowest?limit=10"
```

## 🚨 Alerting System

### Alert Types

The monitoring service automatically generates alerts for:

- **Service Health**: Unhealthy or degraded services
- **High CPU Usage**: CPU utilization above threshold
- **High Memory Usage**: Memory consumption above threshold
- **Slow Response Times**: Response times exceeding limits
- **High Error Rates**: Error rate above acceptable levels

### Alert Severity Levels

- **CRITICAL**: Immediate attention required
- **HIGH**: Important issue that needs prompt resolution
- **MEDIUM**: Moderate issue that should be addressed
- **LOW**: Informational alert

### Alert Lifecycle

1. **Detection**: Alert is created when threshold is exceeded
2. **Notification**: Alert is sent via configured channels
3. **Acknowledgment**: Alert is acknowledged by team member
4. **Resolution**: Alert is resolved when issue is fixed

### Alert Management

```bash
# Get active alerts
curl "http://localhost:3009/alerts/active?limit=50"

# Acknowledge alert
curl -X POST http://localhost:3009/alerts/alert-id/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"acknowledgedBy": "admin@rubizzhotel.com"}'

# Resolve alert
curl -X POST http://localhost:3009/alerts/alert-id/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolvedBy": "admin@rubizzhotel.com"}'
```

### Notification Channels

#### Email Notifications
```env
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USER=monitoring@rubizzhotel.com
ALERT_EMAIL_PASS=your-app-password
ALERT_EMAIL_FROM=monitoring@rubizzhotel.com
ALERT_EMAIL_TO=admin@rubizzhotel.com
```

#### Slack Notifications
```env
ALERT_SLACK_ENABLED=true
ALERT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### PagerDuty Notifications
```env
ALERT_PAGERDUTY_ENABLED=true
ALERT_PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key
```

## 🗄️ Database Schema

### Core Tables

#### Service Health
```sql
CREATE TABLE service_health (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  service_url TEXT NOT NULL,
  status TEXT NOT NULL,
  response_time INTEGER,
  last_checked TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB
);
```

#### System Metrics
```sql
CREATE TABLE system_metrics (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value FLOAT NOT NULL,
  labels JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### Performance Metrics
```sql
CREATE TABLE performance_metrics (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  request_size INTEGER,
  response_size INTEGER,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### Alerts
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  value FLOAT,
  threshold FLOAT,
  labels JSONB,
  resolved_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  acknowledged_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🛠️ Development

### Project Structure

```
src/
├── config/           # Configuration management
├── controllers/      # API controllers
├── database/         # Database connections
├── middleware/       # Express middleware
├── models/           # Data models
├── services/         # Business logic services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── index.ts          # Application entry point
```

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build           # Build for production
npm start              # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:push     # Push schema to database
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Linting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

### Adding New Metrics

1. **Define Metric Type**:
```typescript
// In types/metrics.types.ts
export interface CustomMetric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
}
```

2. **Record Metric**:
```typescript
// In your service
import { MetricsCollectionService } from '@/services/MetricsCollectionService';

const metricsService = MetricsCollectionService.getInstance();
await metricsService.recordCustomMetric(
  'rubizz-hotel-service',
  'custom_metric_name',
  100,
  'GAUGE',
  { label1: 'value1' }
);
```

3. **Query Metric**:
```bash
curl "http://localhost:3009/metrics/system?metricName=custom_metric_name&serviceName=rubizz-hotel-service"
```

### Adding New Alert Rules

1. **Create Alert Rule**:
```typescript
// In services/AlertService.ts
private async checkCustomAlert(serviceName: string, metricName: string) {
  const metric = await SystemMetricsModel.getLatestMetric(serviceName, metricName);
  if (metric && metric.value > CUSTOM_THRESHOLD) {
    await this.createAlert({
      serviceName,
      alertType: 'custom_metric_high',
      severity: AlertSeverity.HIGH,
      status: AlertStatus.ACTIVE,
      title: `Custom metric high for ${serviceName}`,
      description: `Custom metric ${metricName} is ${metric.value}, exceeding threshold`,
      value: metric.value,
      threshold: CUSTOM_THRESHOLD,
    });
  }
}
```

2. **Add to Alert Checks**:
```typescript
// In checkAlerts method
await this.checkCustomAlert('rubizz-hotel-service', 'custom_metric_name');
```

## 🚀 Deployment

### Docker Deployment

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3009

CMD ["npm", "start"]
```

2. **Docker Compose**:
```yaml
version: '3.8'
services:
  monitoring-service:
    build: .
    ports:
      - "3009:3009"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/monitoring_db
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=monitoring_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

1. **Deployment YAML**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rubizz-monitoring-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rubizz-monitoring-service
  template:
    metadata:
      labels:
        app: rubizz-monitoring-service
    spec:
      containers:
      - name: monitoring-service
        image: rubizz-monitoring-service:latest
        ports:
        - containerPort: 3009
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: monitoring-secrets
              key: database-url
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
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

2. **Service YAML**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: rubizz-monitoring-service
spec:
  selector:
    app: rubizz-monitoring-service
  ports:
  - port: 3009
    targetPort: 3009
  type: ClusterIP
```

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
METRICS_COLLECTION_INTERVAL=10000
HEALTH_CHECK_INTERVAL=30000
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=info
METRICS_COLLECTION_INTERVAL=30000
HEALTH_CHECK_INTERVAL=60000
ALERT_EMAIL_ENABLED=true
ALERT_SLACK_ENABLED=true
```

## 📈 Monitoring

### Service Health

Monitor the monitoring service itself:

```bash
# Check service health
curl http://localhost:3009/health

# Get detailed status
curl http://localhost:3009/health/detailed

# Check service info
curl http://localhost:3009/api/info
```

### Key Metrics to Monitor

1. **Service Availability**: Uptime percentage
2. **Response Times**: API response times
3. **Error Rates**: 4xx/5xx error rates
4. **Resource Usage**: CPU, memory, disk usage
5. **Database Performance**: Query times, connection pool
6. **Redis Performance**: Cache hit rates, response times

### Log Monitoring

The service generates structured logs for:

- **Request Logs**: All API requests and responses
- **Error Logs**: Application errors and exceptions
- **Performance Logs**: Slow requests and bottlenecks
- **Alert Logs**: Alert generation and resolution
- **Service Logs**: Health check and metrics collection

### Dashboard Integration

The service provides data for integration with:

- **Grafana**: Metrics visualization
- **Prometheus**: Metrics collection
- **Kibana**: Log analysis
- **Custom Dashboards**: Business-specific monitoring

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
npm run dev

# Verify database connection
npm run prisma:studio

# Check environment variables
cat .env
```

#### Health Checks Failing
```bash
# Check service endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service

# Verify network connectivity
telnet localhost 3000
```

#### Metrics Not Collecting
```bash
# Check metrics collection status
curl http://localhost:3009/api/info

# Verify Redis connection
redis-cli ping

# Check database connectivity
npm run prisma:studio
```

#### Alerts Not Sending
```bash
# Test notification channels
curl -X POST http://localhost:3009/alerts/test-notification \
  -H "Content-Type: application/json" \
  -d '{"channel": "email"}'

# Check notification status
curl http://localhost:3009/alerts/notification-status
```

### Performance Issues

#### High Memory Usage
- Check for memory leaks in metrics collection
- Verify buffer sizes and cleanup intervals
- Monitor garbage collection

#### Slow Response Times
- Check database query performance
- Verify Redis connection latency
- Monitor external service response times

#### Database Issues
- Check connection pool settings
- Monitor query performance
- Verify database indexes

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Health Check Endpoints

```bash
# Basic health
curl http://localhost:3009/health

# Detailed health with service status
curl http://localhost:3009/health/detailed

# Service-specific health
curl http://localhost:3009/health/service/rubizz-hotel-service
```

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3009/api-docs`
- **OpenAPI Spec**: `http://localhost:3009/api-docs.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Email**: support@rubizzhotel.com
- **Documentation**: [Internal Wiki]
- **Issues**: [GitHub Issues]

---

**Rubizz Monitoring Service** - Enterprise-grade monitoring for the Rubizz Hotel Inn ecosystem.
