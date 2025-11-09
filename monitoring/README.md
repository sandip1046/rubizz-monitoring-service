# Monitoring Stack Setup Guide

This directory contains the Docker Compose configuration for the monitoring stack used by the Rubizz Monitoring Service.

## Services Included

### 1. **Prometheus** (Port 9090)
- **Cost**: FREE (Open-source)
- **Purpose**: Metrics collection and storage
- **Access**: http://localhost:9090

### 2. **Grafana** (Port 3001)
- **Cost**: FREE (Open-source)
- **Purpose**: Visualization and dashboards
- **Access**: http://localhost:3001
- **Default Credentials**: 
  - Username: `admin`
  - Password: `admin`

### 3. **Elasticsearch** (Port 9200)
- **Cost**: FREE (Open-source version)
- **Purpose**: Log search and analytics
- **Access**: http://localhost:9200

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available for Elasticsearch

### Start All Services

```bash
cd Server/rubizz-monitoring-service
docker-compose up -d
```

### Check Service Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f prometheus
docker-compose logs -f grafana
docker-compose logs -f elasticsearch
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Update your `.env` file with these endpoints (already configured in `env.example`):

```env
PROMETHEUS_ENDPOINT=http://localhost:9090
GRAFANA_ENDPOINT=http://localhost:3001
ELASTICSEARCH_ENDPOINT=http://localhost:9200
```

### Prometheus Configuration

Edit `monitoring/prometheus.yml` to add or modify scrape targets.

### Grafana Dashboards

Place custom dashboard JSON files in `monitoring/grafana/dashboards/` directory.

## Cost Comparison

| Service | Self-Hosted (Docker) | Cloud Hosted |
|---------|---------------------|--------------|
| Prometheus | **FREE** | $50-200/month |
| Grafana | **FREE** | $50-200/month |
| Elasticsearch | **FREE** | $200-1000+/month |

**Recommendation**: Use Docker (self-hosted) for development and small-to-medium production deployments. It's completely free and gives you full control.

## Resource Requirements

- **Minimum**: 4GB RAM, 2 CPU cores, 20GB disk
- **Recommended**: 8GB RAM, 4 CPU cores, 50GB disk

## Troubleshooting

### Elasticsearch won't start
- Ensure Docker has enough memory allocated (minimum 4GB)
- Check: `docker info | grep Memory`

### Port conflicts
- If ports 9090, 3001, or 9200 are already in use, modify the port mappings in `docker-compose.yml`

### Data persistence
- All data is stored in Docker volumes and persists across container restarts
- Volumes: `prometheus_data`, `grafana_data`, `elasticsearch_data`

## Next Steps

1. Start the services: `docker-compose up -d`
2. Access Grafana: http://localhost:3001 (admin/admin)
3. Configure Prometheus as a data source in Grafana (auto-configured)
4. Import or create dashboards for your monitoring needs

