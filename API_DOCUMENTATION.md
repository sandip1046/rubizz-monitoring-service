# Rubizz Monitoring Service - API Documentation

**Service**: rubizz-monitoring-service  
**Port**: 3014  
**Version**: 1.0.0  
**Base URL**: `http://localhost:3014` (Development) | `https://rubizz-monitoring-service.onrender.com` (Production)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Health Checks](#health-checks)
4. [REST API Endpoints](#rest-api-endpoints)
5. [GraphQL API](#graphql-api)
6. [gRPC API](#grpc-api)
7. [WebSocket API](#websocket-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Integration Examples](#integration-examples)

---

## 🎯 Overview

The Monitoring Service provides comprehensive system monitoring, health checks, metrics collection, alerting, and Kafka monitoring capabilities for the Rubizz Hotel Inn microservices architecture.

### Key Features

- **Health Monitoring**: Real-time health checks for all microservices
- **Metrics Collection**: System, performance, and resource metrics
- **Alert Management**: Create, manage, and resolve alerts with severity levels
- **Performance Monitoring**: Track response times, error rates, and throughput
- **Kafka Monitoring**: Monitor Kafka cluster health, topics, consumer groups, and lag
- **Service Registry**: Track and monitor all registered services
- **Real-time Updates**: WebSocket support for real-time monitoring data
- **Custom Metrics**: Record and track custom metrics from services

### Supported Protocols

- ✅ **REST API**: HTTP/HTTPS requests
- ✅ **GraphQL**: GraphQL queries and mutations
- ✅ **gRPC**: Internal service-to-service communication
- ✅ **WebSocket**: Real-time monitoring updates and subscriptions
- ✅ **Kafka**: Event streaming for metrics and alerts
- ✅ **Prometheus**: Prometheus-compatible metrics endpoint

### Service Status

| Status | Description |
|--------|-------------|
| `HEALTHY` | Service is operating normally |
| `UNHEALTHY` | Service is experiencing issues |
| `DEGRADED` | Service is partially functional |
| `UNKNOWN` | Service status cannot be determined |
| `MAINTENANCE` | Service is in maintenance mode |

### Alert Severity Levels

| Severity | Description |
|----------|-------------|
| `LOW` | Low priority alert |
| `MEDIUM` | Medium priority alert |
| `HIGH` | High priority alert |
| `CRITICAL` | Critical alert requiring immediate attention |

### Alert Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Alert is active and unresolved |
| `RESOLVED` | Alert has been resolved |
| `ACKNOWLEDGED` | Alert has been acknowledged |
| `SUPPRESSED` | Alert has been suppressed |

### Metric Types

| Type | Description |
|------|-------------|
| `COUNTER` | Incremental counter metric |
| `GAUGE` | Value that can go up or down |
| `HISTOGRAM` | Distribution of values |
| `SUMMARY` | Summary statistics |

---

## 🔐 Authentication

Most endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <access_token>
```

Some health check endpoints are publicly accessible.

---

## 🏥 Health Checks

### Check Service Health

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "serviceName": "rubizz-monitoring-service",
  "timestamp": "2025-11-11T10:30:00Z",
  "responseTime": 5,
  "details": {
    "version": "1.0.0",
    "uptime": 3600,
    "memory": {
      "used": 52428800,
      "total": 134217728,
      "percentage": 39.06
    },
    "cpu": {
      "usage": 25.5,
      "load": [0.5, 0.6, 0.7]
    },
    "database": {
      "connected": true,
      "responseTime": 3
    },
    "redis": {
      "connected": true,
      "responseTime": 2
    }
  },
  "checks": {
    "database": true,
    "redis": true,
    "externalServices": true
  },
  "services": {
    "healthCheck": {
      "isRunning": true,
      "lastCheck": "2025-11-11T10:29:55Z"
    },
    "metricsCollection": {
      "isRunning": true,
      "lastCollection": "2025-11-11T10:29:58Z"
    },
    "alert": {
      "isRunning": true,
      "lastCheck": "2025-11-11T10:29:50Z"
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "UNHEALTHY",
  "serviceName": "rubizz-monitoring-service",
  "timestamp": "2025-11-11T10:30:00Z",
  "responseTime": 5,
  "error": "Database connection failed"
}
```

### Detailed Health Check

```http
GET /health/detailed
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "overall": "HEALTHY",
    "services": [
      {
        "name": "rubizz-hotel-service",
        "status": "HEALTHY",
        "responseTime": 15,
        "lastChecked": "2025-11-11T10:29:55Z",
        "details": {
          "version": "1.0.0",
          "uptime": 3600
        }
      },
      {
        "name": "rubizz-user-service",
        "status": "HEALTHY",
        "responseTime": 12,
        "lastChecked": "2025-11-11T10:29:56Z"
      }
    ],
    "systemMetrics": {
      "totalServices": 15,
      "healthyServices": 14,
      "unhealthyServices": 1,
      "degradedServices": 0
    },
    "activeAlerts": {
      "total": 5,
      "critical": 1,
      "high": 2,
      "medium": 2
    },
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "message": "Detailed health check completed"
}
```

### Get Service Health

```http
GET /health/service/:serviceName
```

**Path Parameters:**
- `serviceName` (required): Service name (e.g., `rubizz-hotel-service`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceName": "rubizz-hotel-service",
    "status": "HEALTHY",
    "responseTime": 15,
    "lastChecked": "2025-11-11T10:29:55Z",
    "details": {
      "version": "1.0.0",
      "uptime": 3600,
      "memory": {
        "used": 52428800,
        "total": 134217728
      },
      "cpu": {
        "usage": 25.5
      }
    }
  },
  "message": "Service health retrieved successfully"
}
```

### Get Service Health Summary

```http
GET /health/service/:serviceName/summary
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceName": "rubizz-hotel-service",
    "status": "HEALTHY",
    "uptime": 3600,
    "lastChecked": "2025-11-11T10:29:55Z",
    "healthScore": 95.5,
    "recentIssues": []
  },
  "message": "Service health summary retrieved successfully"
}
```

### Get Services by Status

```http
GET /health/status/:status
```

**Path Parameters:**
- `status` (required): One of `HEALTHY`, `UNHEALTHY`, `DEGRADED`, `UNKNOWN`, `MAINTENANCE`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "serviceName": "rubizz-hotel-service",
      "status": "HEALTHY",
      "lastChecked": "2025-11-11T10:29:55Z"
    }
  ],
  "message": "Services retrieved successfully"
}
```

### Check Custom Service Health

```http
POST /health/check
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceName": "custom-service",
  "serviceUrl": "http://localhost:3000",
  "timeout": 5000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceName": "custom-service",
    "serviceUrl": "http://localhost:3000",
    "status": "HEALTHY",
    "responseTime": 12,
    "lastChecked": "2025-11-11T10:30:00Z"
  },
  "message": "Service health check completed"
}
```

### Start Health Check Service

```http
POST /health/start
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Health check service started successfully"
}
```

### Stop Health Check Service

```http
POST /health/stop
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Health check service stopped successfully"
}
```

---

## 📡 REST API Endpoints

### Metrics Endpoints

#### Get System Metrics

```http
GET /metrics/system?serviceName=rubizz-hotel-service&metricName=cpu_usage&startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z&aggregation=avg&limit=100&offset=0
```

**Query Parameters:**
- `serviceName` (optional): Filter by service name
- `metricName` (optional): Filter by metric name
- `startTime` (optional): Start time (ISO 8601)
- `endTime` (optional): End time (ISO 8601)
- `aggregation` (optional): Aggregation type (`avg`, `sum`, `min`, `max`, `count`)
- `groupBy` (optional): Group by field
- `limit` (optional): Result limit (default: 100, max: 1000)
- `offset` (optional): Result offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric_1234567890",
      "serviceName": "rubizz-hotel-service",
      "metricName": "cpu_usage",
      "metricType": "GAUGE",
      "value": 25.5,
      "labels": {
        "environment": "production"
      },
      "timestamp": "2025-11-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "aggregation": {
    "type": "avg",
    "value": 25.5
  },
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Get Performance Metrics

```http
GET /metrics/performance?serviceName=rubizz-hotel-service&startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "perf_1234567890",
      "serviceName": "rubizz-hotel-service",
      "endpoint": "/api/v1/bookings",
      "method": "GET",
      "responseTime": 150,
      "statusCode": 200,
      "requestSize": 1024,
      "responseSize": 2048,
      "timestamp": "2025-11-11T10:30:00Z"
    }
  ],
  "message": "Performance metrics retrieved successfully"
}
```

#### Get Performance Summary

```http
GET /metrics/performance/:serviceName/summary?startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z
```

**Path Parameters:**
- `serviceName` (required): Service name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceName": "rubizz-hotel-service",
    "summary": {
      "totalRequests": 10000,
      "averageResponseTime": 150,
      "p95ResponseTime": 250,
      "p99ResponseTime": 500,
      "errorRate": 0.5,
      "throughput": 100
    },
    "byEndpoint": [
      {
        "endpoint": "/api/v1/bookings",
        "method": "GET",
        "totalRequests": 5000,
        "averageResponseTime": 120,
        "errorRate": 0.2
      }
    ],
    "byStatusCode": {
      "200": 9500,
      "400": 30,
      "500": 20
    },
    "period": {
      "startTime": "2025-11-01T00:00:00Z",
      "endTime": "2025-11-11T23:59:59Z"
    }
  },
  "message": "Performance summary retrieved successfully"
}
```

#### Get Metrics Summary

```http
GET /metrics/:serviceName/summary?hours=24
```

**Path Parameters:**
- `serviceName` (required): Service name

**Query Parameters:**
- `hours` (optional): Number of hours to summarize (default: 1)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "serviceName": "rubizz-hotel-service",
    "summary": {
      "cpuUsage": {
        "average": 25.5,
        "max": 50.0,
        "min": 10.0
      },
      "memoryUsage": {
        "average": 52428800,
        "max": 67108864,
        "min": 41943040
      },
      "responseTime": {
        "average": 150,
        "p95": 250,
        "p99": 500
      },
      "errorRate": 0.5,
      "throughput": 100
    },
    "period": {
      "hours": 24,
      "startTime": "2025-11-10T10:30:00Z",
      "endTime": "2025-11-11T10:30:00Z"
    }
  },
  "message": "Metrics summary retrieved successfully"
}
```

#### Record Custom Metric

```http
POST /metrics/record
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceName": "rubizz-hotel-service",
  "metricName": "custom_metric",
  "metricType": "GAUGE",
  "value": 100.5,
  "labels": {
    "environment": "production",
    "region": "us-east-1"
  }
}
```

**Field Validation:**
- `serviceName` (required): Service name
- `metricName` (required): Metric name
- `metricType` (required): One of `COUNTER`, `GAUGE`, `HISTOGRAM`, `SUMMARY`
- `value` (required): Metric value (number)
- `labels` (optional): Metric labels (key-value pairs)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "metric_1234567890",
    "serviceName": "rubizz-hotel-service",
    "metricName": "custom_metric",
    "metricType": "GAUGE",
    "value": 100.5,
    "labels": {
      "environment": "production",
      "region": "us-east-1"
    },
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "message": "Metric recorded successfully"
}
```

#### Get Slowest Endpoints

```http
GET /metrics/performance/:serviceName/slowest?limit=10&startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z
```

**Path Parameters:**
- `serviceName` (required): Service name

**Query Parameters:**
- `limit` (optional): Number of endpoints (default: 10)
- `startTime` (optional): Start time (ISO 8601)
- `endTime` (optional): End time (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/v1/bookings/search",
      "method": "GET",
      "averageResponseTime": 500,
      "p95ResponseTime": 750,
      "p99ResponseTime": 1000,
      "requestCount": 1000
    }
  ],
  "message": "Slowest endpoints retrieved successfully"
}
```

#### Get Error Rate by Endpoint

```http
GET /metrics/performance/:serviceName/error-rates?startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/v1/bookings",
      "method": "GET",
      "totalRequests": 1000,
      "errorCount": 5,
      "errorRate": 0.5,
      "errorsByStatusCode": {
        "400": 2,
        "500": 3
      }
    }
  ],
  "message": "Error rates retrieved successfully"
}
```

#### Start Metrics Collection

```http
POST /metrics/start
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metrics collection started successfully"
}
```

#### Stop Metrics Collection

```http
POST /metrics/stop
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metrics collection stopped successfully"
}
```

### Alert Management Endpoints

#### Get Active Alerts

```http
GET /alerts/active?limit=100&offset=0
```

**Query Parameters:**
- `limit` (optional): Result limit (default: 100, max: 1000)
- `offset` (optional): Result offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_1234567890",
      "serviceName": "rubizz-hotel-service",
      "alertType": "high_response_time",
      "severity": "HIGH",
      "status": "ACTIVE",
      "title": "High Response Time Detected",
      "description": "Average response time exceeded threshold",
      "value": 500,
      "threshold": 200,
      "labels": {
        "endpoint": "/api/v1/bookings"
      },
      "createdAt": "2025-11-11T10:25:00Z"
    }
  ],
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Get Critical Alerts

```http
GET /alerts/critical?limit=50
```

**Query Parameters:**
- `limit` (optional): Result limit (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_1234567890",
      "serviceName": "rubizz-hotel-service",
      "alertType": "service_down",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "title": "Service Down",
      "description": "Service is not responding",
      "createdAt": "2025-11-11T10:25:00Z"
    }
  ],
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Get Alerts by Service

```http
GET /alerts/service/:serviceName?status=ACTIVE&limit=100&offset=0
```

**Path Parameters:**
- `serviceName` (required): Service name

**Query Parameters:**
- `status` (optional): Filter by alert status
- `limit` (optional): Result limit (default: 100)
- `offset` (optional): Result offset (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_1234567890",
      "serviceName": "rubizz-hotel-service",
      "alertType": "high_response_time",
      "severity": "HIGH",
      "status": "ACTIVE",
      "title": "High Response Time",
      "createdAt": "2025-11-11T10:25:00Z"
    }
  ],
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Get Alerts Summary

```http
GET /alerts/summary
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 10,
    "resolved": 12,
    "acknowledged": 3,
    "bySeverity": {
      "CRITICAL": 2,
      "HIGH": 5,
      "MEDIUM": 15,
      "LOW": 3
    },
    "byService": {
      "rubizz-hotel-service": 10,
      "rubizz-user-service": 8,
      "rubizz-restaurant-service": 7
    },
    "recentAlerts": [
      {
        "id": "alert_1234567890",
        "serviceName": "rubizz-hotel-service",
        "severity": "HIGH",
        "title": "High Response Time",
        "createdAt": "2025-11-11T10:25:00Z"
      }
    ]
  },
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Get Alert Trends

```http
GET /alerts/trends?startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z&groupBy=day
```

**Query Parameters:**
- `startTime` (optional): Start time (ISO 8601)
- `endTime` (optional): End time (ISO 8601)
- `groupBy` (optional): Group by period (`hour`, `day`, `week`, `month`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2025-11-01",
        "total": 10,
        "critical": 1,
        "high": 3,
        "medium": 5,
        "low": 1
      },
      {
        "period": "2025-11-02",
        "total": 8,
        "critical": 0,
        "high": 2,
        "medium": 5,
        "low": 1
      }
    ],
    "summary": {
      "averagePerDay": 9,
      "peakDay": "2025-11-01",
      "peakCount": 10
    }
  },
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Create Alert

```http
POST /alerts
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceName": "rubizz-hotel-service",
  "alertType": "high_response_time",
  "severity": "HIGH",
  "title": "High Response Time Detected",
  "description": "Average response time exceeded threshold of 200ms",
  "value": 500,
  "threshold": 200,
  "labels": {
    "endpoint": "/api/v1/bookings",
    "environment": "production"
  }
}
```

**Field Validation:**
- `serviceName` (required): Service name
- `alertType` (required): Alert type identifier
- `severity` (required): One of `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `title` (required): Alert title
- `description` (required): Alert description
- `value` (optional): Current value that triggered alert
- `threshold` (optional): Threshold value
- `labels` (optional): Additional labels

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "alert_1234567890",
    "serviceName": "rubizz-hotel-service",
    "alertType": "high_response_time",
    "severity": "HIGH",
    "status": "ACTIVE",
    "title": "High Response Time Detected",
    "description": "Average response time exceeded threshold of 200ms",
    "value": 500,
    "threshold": 200,
    "labels": {
      "endpoint": "/api/v1/bookings",
      "environment": "production"
    },
    "createdAt": "2025-11-11T10:30:00Z"
  },
  "message": "Alert created successfully"
}
```

#### Get Alert by ID

```http
GET /alerts/:alertId
```

**Path Parameters:**
- `alertId` (required): Alert ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "alert_1234567890",
    "serviceName": "rubizz-hotel-service",
    "alertType": "high_response_time",
    "severity": "HIGH",
    "status": "ACTIVE",
    "title": "High Response Time Detected",
    "description": "Average response time exceeded threshold",
    "value": 500,
    "threshold": 200,
    "labels": {},
    "createdAt": "2025-11-11T10:25:00Z",
    "resolvedAt": null,
    "acknowledgedAt": null
  },
  "timestamp": "2025-11-11T10:30:00Z"
}
```

#### Acknowledge Alert

```http
POST /alerts/:alertId/acknowledge
Content-Type: application/json
```

**Request Body:**
```json
{
  "acknowledgedBy": "user_123",
  "notes": "Investigating the issue"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "alert_1234567890",
    "status": "ACKNOWLEDGED",
    "acknowledgedAt": "2025-11-11T10:35:00Z",
    "acknowledgedBy": "user_123"
  },
  "message": "Alert acknowledged successfully"
}
```

#### Resolve Alert

```http
POST /alerts/:alertId/resolve
Content-Type: application/json
```

**Request Body:**
```json
{
  "resolvedBy": "user_123",
  "resolution": "Issue fixed by restarting service"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "alert_1234567890",
    "status": "RESOLVED",
    "resolvedAt": "2025-11-11T10:35:00Z",
    "resolvedBy": "user_123"
  },
  "message": "Alert resolved successfully"
}
```

#### Send Test Notification

```http
POST /alerts/test-notification
Content-Type: application/json
```

**Request Body:**
```json
{
  "channel": "email",
  "recipient": "admin@example.com",
  "message": "Test alert notification"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Test notification sent successfully"
}
```

#### Get Notification Status

```http
GET /alerts/notification-status
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "email": {
      "enabled": true,
      "lastSent": "2025-11-11T10:25:00Z",
      "successRate": 98.5
    },
    "sms": {
      "enabled": false
    },
    "slack": {
      "enabled": true,
      "lastSent": "2025-11-11T10:24:00Z",
      "successRate": 99.0
    }
  },
  "message": "Notification status retrieved successfully"
}
```

#### Start Alert Service

```http
POST /alerts/start
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alert service started successfully"
}
```

#### Stop Alert Service

```http
POST /alerts/stop
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alert service stopped successfully"
}
```

### Kafka Monitoring Endpoints

#### Get Kafka Cluster Health

```http
GET /api/v1/kafka/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "brokers": [
      {
        "id": 1,
        "host": "localhost",
        "port": 9092,
        "status": "online"
      }
    ],
    "topics": {
      "total": 10,
      "healthy": 9,
      "unhealthy": 1
    },
    "consumerGroups": {
      "total": 5,
      "healthy": 4,
      "lagging": 1
    },
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "message": "Cluster health retrieved successfully"
}
```

#### Get All Topics

```http
GET /api/v1/kafka/topics
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "name": "rubizz-logs",
      "partitions": 3,
      "replicationFactor": 1,
      "config": {
        "retention.ms": "604800000"
      }
    },
    {
      "name": "rubizz-events",
      "partitions": 5,
      "replicationFactor": 1
    }
  ],
  "message": "Topics retrieved successfully"
}
```

#### Get Topic Information

```http
GET /api/v1/kafka/topics/:topic
```

**Path Parameters:**
- `topic` (required): Topic name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "name": "rubizz-logs",
    "partitions": 3,
    "replicationFactor": 1,
    "config": {
      "retention.ms": "604800000",
      "compression.type": "gzip"
    },
    "partitions": [
      {
        "id": 0,
        "leader": 1,
        "replicas": [1, 2],
        "isr": [1, 2]
      }
    ]
  },
  "message": "Topic information retrieved successfully"
}
```

#### Get Topic Metrics

```http
GET /api/v1/kafka/topics/:topic/metrics
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topic": "rubizz-logs",
    "metrics": {
      "messageRate": 1000,
      "byteRate": 1024000,
      "totalMessages": 1000000,
      "totalBytes": 1024000000,
      "partitionCount": 3,
      "replicationFactor": 1
    },
    "partitions": [
      {
        "id": 0,
        "messageCount": 333333,
        "size": 341333333,
        "offset": {
          "earliest": 0,
          "latest": 333333
        }
      }
    ],
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "message": "Topic metrics retrieved successfully"
}
```

#### Get Consumer Groups

```http
GET /api/v1/kafka/consumer-groups
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "groupId": "rubizz-logs-consumer",
      "state": "Stable",
      "members": 3,
      "topics": ["rubizz-logs"],
      "lag": {
        "total": 100,
        "byTopic": {
          "rubizz-logs": 100
        }
      }
    }
  ],
  "message": "Consumer groups retrieved successfully"
}
```

#### Get Consumer Group Information

```http
GET /api/v1/kafka/consumer-groups/:groupId
```

**Path Parameters:**
- `groupId` (required): Consumer group ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "groupId": "rubizz-logs-consumer",
    "state": "Stable",
    "members": 3,
    "topics": ["rubizz-logs"],
    "members": [
      {
        "memberId": "member-1",
        "clientId": "consumer-1",
        "host": "localhost",
        "partitions": [0, 1]
      }
    ],
    "lag": {
      "total": 100,
      "byTopic": {
        "rubizz-logs": 100
      },
      "byPartition": {
        "0": 30,
        "1": 40,
        "2": 30
      }
    }
  },
  "message": "Consumer group information retrieved successfully"
}
```

#### Get Consumer Lag

```http
GET /api/v1/kafka/consumer-groups/:groupId/lag?topics=rubizz-logs,rubizz-events
```

**Path Parameters:**
- `groupId` (required): Consumer group ID

**Query Parameters:**
- `topics` (optional): Comma-separated list of topics

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "groupId": "rubizz-logs-consumer",
    "lag": {
      "total": 100,
      "byTopic": {
        "rubizz-logs": 100,
        "rubizz-events": 0
      },
      "byPartition": {
        "rubizz-logs-0": 30,
        "rubizz-logs-1": 40,
        "rubizz-logs-2": 30
      }
    },
    "timestamp": "2025-11-11T10:30:00Z"
  },
  "message": "Consumer lag retrieved successfully"
}
```

#### Get High Lag Consumers

```http
GET /api/v1/kafka/consumer-groups/high-lag?threshold=1000
```

**Query Parameters:**
- `threshold` (optional): Lag threshold (default: 1000)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "groupId": "rubizz-logs-consumer",
      "topic": "rubizz-logs",
      "partition": 0,
      "lag": 5000,
      "threshold": 1000,
      "status": "high_lag"
    }
  ],
  "message": "High lag consumers retrieved successfully"
}
```

#### Create Topic

```http
POST /api/v1/kafka/topics
Content-Type: application/json
```

**Request Body:**
```json
{
  "topic": "new-topic",
  "partitions": 3,
  "replicationFactor": 1
}
```

**Field Validation:**
- `topic` (required): Topic name
- `partitions` (required): Number of partitions (positive integer)
- `replicationFactor` (required): Replication factor (positive integer)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "topic": "new-topic",
    "partitions": 3,
    "replicationFactor": 1
  },
  "message": "Topic created successfully"
}
```

#### Delete Topic

```http
DELETE /api/v1/kafka/topics/:topic
```

**Path Parameters:**
- `topic` (required): Topic name

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Topic deleted successfully"
}
```

#### Increase Topic Partitions

```http
PATCH /api/v1/kafka/topics/:topic/partitions
Content-Type: application/json
```

**Path Parameters:**
- `topic` (required): Topic name

**Request Body:**
```json
{
  "newPartitionCount": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topic": "rubizz-logs",
    "newPartitionCount": 5
  },
  "message": "Topic partitions increased successfully"
}
```

---

## 🔵 GraphQL API

The Monitoring Service supports GraphQL queries and mutations. Access the GraphQL endpoint at:

```http
POST /graphql
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Example Query

```graphql
query {
  serviceHealth(serviceName: "rubizz-hotel-service") {
    serviceName
    status
    responseTime
    lastChecked
  }
  
  activeAlerts(limit: 10) {
    id
    serviceName
    severity
    title
    status
    createdAt
  }
  
  systemMetrics(
    serviceName: "rubizz-hotel-service"
    startTime: "2025-11-01T00:00:00Z"
    endTime: "2025-11-11T23:59:59Z"
  ) {
    serviceName
    metricName
    value
    timestamp
  }
}
```

### Example Mutation

```graphql
mutation {
  createAlert(input: {
    serviceName: "rubizz-hotel-service"
    alertType: "high_response_time"
    severity: HIGH
    title: "High Response Time"
    description: "Response time exceeded threshold"
    value: 500
    threshold: 200
  }) {
    id
    status
    createdAt
  }
  
  acknowledgeAlert(alertId: "alert_1234567890", acknowledgedBy: "user_123") {
    id
    status
    acknowledgedAt
  }
}
```

---

## 🔷 gRPC API

The Monitoring Service exposes gRPC endpoints for internal service-to-service communication.

**Port**: 50054 (default)

### Service Definition

```protobuf
service MonitoringService {
  rpc GetServiceHealth(ServiceHealthRequest) returns (ServiceHealthResponse);
  rpc RecordMetric(RecordMetricRequest) returns (MetricResponse);
  rpc CreateAlert(CreateAlertRequest) returns (AlertResponse);
  rpc GetMetrics(MetricsRequest) returns (MetricsResponse);
}
```

---

## 🔌 WebSocket API

The Monitoring Service supports WebSocket connections for real-time monitoring updates.

**Endpoint**: `ws://localhost:3014`

### Connection

```javascript
const socket = io('http://localhost:3014', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### Subscribe to Service Health Updates

```javascript
socket.emit('subscribe', {
  channel: 'service_health',
  serviceName: 'rubizz-hotel-service'
});
```

#### Receive Health Updates

```javascript
socket.on('health_update', (data) => {
  console.log('Service health updated:', data);
});
```

#### Subscribe to Alerts

```javascript
socket.emit('subscribe', {
  channel: 'alerts',
  severity: 'CRITICAL'
});
```

#### Receive Alert Updates

```javascript
socket.on('alert_created', (data) => {
  console.log('New alert:', data);
});

socket.on('alert_resolved', (data) => {
  console.log('Alert resolved:', data);
});
```

#### Subscribe to Metrics

```javascript
socket.emit('subscribe', {
  channel: 'metrics',
  serviceName: 'rubizz-hotel-service',
  metricName: 'cpu_usage'
});
```

#### Receive Metric Updates

```javascript
socket.on('metric_update', (data) => {
  console.log('Metric updated:', data);
});
```

---

## ⚠️ Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_SERVICE_NAME` | Invalid service name |
| 400 | `INVALID_METRIC_TYPE` | Invalid metric type |
| 400 | `INVALID_ALERT_SEVERITY` | Invalid alert severity |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 404 | `SERVICE_NOT_FOUND` | Service not found |
| 404 | `ALERT_NOT_FOUND` | Alert not found |
| 404 | `TOPIC_NOT_FOUND` | Kafka topic not found |
| 409 | `DUPLICATE_ALERT` | Duplicate alert exists |
| 422 | `INVALID_TIME_RANGE` | Invalid time range |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Internal server error |
| 503 | `SERVICE_UNAVAILABLE` | Service unavailable |

---

## 🚦 Rate Limiting

Rate limiting is applied to protect the service from abuse.

### Rate Limit Configuration

| Endpoint Type | Window | Max Requests |
|--------------|--------|--------------|
| General API | 15 minutes | 1000 requests |
| Health Checks | 1 minute | 60 requests |
| Metrics | 1 minute | 200 requests |
| Alerts | 1 minute | 100 requests |
| Kafka Monitoring | 1 minute | 50 requests |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699702200
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "timestamp": "2025-11-11T10:30:00Z"
}
```

---

## 💻 Integration Examples

### JavaScript/TypeScript (Fetch API)

```javascript
// Get service health
async function getServiceHealth(serviceName) {
  const response = await fetch(
    `http://localhost:3014/health/service/${serviceName}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return await response.json();
}

// Record custom metric
async function recordMetric(metricData) {
  const response = await fetch('http://localhost:3014/metrics/record', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(metricData)
  });

  return await response.json();
}

// Get active alerts
async function getActiveAlerts(limit = 100) {
  const response = await fetch(
    `http://localhost:3014/alerts/active?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return await response.json();
}

// Create alert
async function createAlert(alertData) {
  const response = await fetch('http://localhost:3014/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(alertData)
  });

  return await response.json();
}
```

### Node.js (Axios)

```javascript
const axios = require('axios');

class MonitoringServiceClient {
  constructor(baseURL = 'http://localhost:3014', accessToken) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getServiceHealth(serviceName) {
    const response = await this.client.get(`/health/service/${serviceName}`);
    return response.data;
  }

  async getSystemMetrics(query) {
    const response = await this.client.get('/metrics/system', {
      params: query
    });
    return response.data;
  }

  async recordMetric(metricData) {
    const response = await this.client.post('/metrics/record', metricData);
    return response.data;
  }

  async getActiveAlerts(limit = 100) {
    const response = await this.client.get('/alerts/active', {
      params: { limit }
    });
    return response.data;
  }

  async createAlert(alertData) {
    const response = await this.client.post('/alerts', alertData);
    return response.data;
  }

  async acknowledgeAlert(alertId, acknowledgedBy) {
    const response = await this.client.post(`/alerts/${alertId}/acknowledge`, {
      acknowledgedBy
    });
    return response.data;
  }

  async getKafkaHealth() {
    const response = await this.client.get('/api/v1/kafka/health');
    return response.data;
  }
}

// Usage
const monitoringClient = new MonitoringServiceClient('http://localhost:3014', 'your_token');

// Get service health
const health = await monitoringClient.getServiceHealth('rubizz-hotel-service');

// Record metric
await monitoringClient.recordMetric({
  serviceName: 'my-service',
  metricName: 'custom_metric',
  metricType: 'GAUGE',
  value: 100.5
});
```

### Python (Requests)

```python
import requests
from datetime import datetime

class MonitoringServiceClient:
    def __init__(self, base_url='http://localhost:3014', access_token=None):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    def get_service_health(self, service_name):
        url = f'{self.base_url}/health/service/{service_name}'
        response = requests.get(url, headers=self.headers)
        return response.json()

    def get_system_metrics(self, **params):
        url = f'{self.base_url}/metrics/system'
        response = requests.get(url, params=params, headers=self.headers)
        return response.json()

    def record_metric(self, metric_data):
        url = f'{self.base_url}/metrics/record'
        response = requests.post(url, json=metric_data, headers=self.headers)
        return response.json()

    def get_active_alerts(self, limit=100):
        url = f'{self.base_url}/alerts/active'
        params = {'limit': limit}
        response = requests.get(url, params=params, headers=self.headers)
        return response.json()

    def create_alert(self, alert_data):
        url = f'{self.base_url}/alerts'
        response = requests.post(url, json=alert_data, headers=self.headers)
        return response.json()

    def acknowledge_alert(self, alert_id, acknowledged_by):
        url = f'{self.base_url}/alerts/{alert_id}/acknowledge'
        response = requests.post(url, json={'acknowledgedBy': acknowledged_by}, headers=self.headers)
        return response.json()

# Usage
client = MonitoringServiceClient('http://localhost:3014', 'your_token')

# Get service health
health = client.get_service_health('rubizz-hotel-service')

# Record metric
client.record_metric({
    'serviceName': 'my-service',
    'metricName': 'custom_metric',
    'metricType': 'GAUGE',
    'value': 100.5
})
```

### cURL Examples

```bash
# Get service health
curl -X GET http://localhost:3014/health/service/rubizz-hotel-service \
  -H "Authorization: Bearer your_token"

# Get system metrics
curl -X GET "http://localhost:3014/metrics/system?serviceName=rubizz-hotel-service&startTime=2025-11-01T00:00:00Z&endTime=2025-11-11T23:59:59Z" \
  -H "Authorization: Bearer your_token"

# Record custom metric
curl -X POST http://localhost:3014/metrics/record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "serviceName": "rubizz-hotel-service",
    "metricName": "custom_metric",
    "metricType": "GAUGE",
    "value": 100.5
  }'

# Get active alerts
curl -X GET "http://localhost:3014/alerts/active?limit=100" \
  -H "Authorization: Bearer your_token"

# Create alert
curl -X POST http://localhost:3014/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "serviceName": "rubizz-hotel-service",
    "alertType": "high_response_time",
    "severity": "HIGH",
    "title": "High Response Time",
    "description": "Response time exceeded threshold"
  }'

# Acknowledge alert
curl -X POST http://localhost:3014/alerts/alert_1234567890/acknowledge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "acknowledgedBy": "user_123"
  }'

# Get Kafka cluster health
curl -X GET http://localhost:3014/api/v1/kafka/health \
  -H "Authorization: Bearer your_token"

# Get Kafka topics
curl -X GET http://localhost:3014/api/v1/kafka/topics \
  -H "Authorization: Bearer your_token"
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Health checks are performed periodically for all registered services
- Metrics are collected and aggregated automatically
- Alerts can be configured with thresholds and severity levels
- Kafka monitoring requires Kafka cluster access
- WebSocket connections support real-time updates for health, metrics, and alerts
- The service maintains a registry of all monitored services
- Prometheus-compatible metrics are available at `/metrics` endpoint
- GraphQL and gRPC are available for advanced integrations

---

**Last Updated**: November 2025

