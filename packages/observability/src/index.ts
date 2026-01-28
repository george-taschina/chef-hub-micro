import pino from 'pino';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Logger configuration
export interface LoggerConfig {
  serviceName: string;
  level?: string;
  pretty?: boolean;
}

// Create a configured logger instance
export function createLogger(config: LoggerConfig) {
  return pino({
    name: config.serviceName,
    level: config.level || 'info',
    transport: config.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      service: config.serviceName,
      env: process.env.NODE_ENV || 'development',
    },
  });
}

// Metrics registry
export class MetricsRegistry {
  private registry: Registry;
  private serviceName: string;

  constructor(serviceName: string) {
    this.registry = new Registry();
    this.serviceName = serviceName;

    // Add default labels
    this.registry.setDefaultLabels({
      service: serviceName,
    });

    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.registry });
  }

  // Create HTTP request counter
  createHttpRequestCounter() {
    return new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });
  }

  // Create HTTP request duration histogram
  createHttpRequestDuration() {
    return new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  // Create gRPC request counter
  createGrpcRequestCounter() {
    return new Counter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['method', 'status'],
      registers: [this.registry],
    });
  }

  // Create gRPC request duration histogram
  createGrpcRequestDuration() {
    return new Histogram({
      name: 'grpc_request_duration_seconds',
      help: 'gRPC request duration in seconds',
      labelNames: ['method', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  // Create RabbitMQ message counter
  createMessageCounter(name: string, help: string) {
    return new Counter({
      name,
      help,
      labelNames: ['queue', 'status'],
      registers: [this.registry],
    });
  }

  // Create database query histogram
  createDbQueryDuration() {
    return new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });
  }

  // Get metrics for Prometheus scraping
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Get content type for metrics endpoint
  getContentType(): string {
    return this.registry.contentType;
  }
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
  timestamp: string;
}

// Health check function type
export type HealthCheck = () => Promise<{ name: string; healthy: boolean; message?: string }>;

// Run health checks
export async function runHealthChecks(checks: HealthCheck[]): Promise<HealthCheckResponse> {
  const results = await Promise.all(checks.map((check) => check()));

  const response: HealthCheckResponse = {
    status: results.every((r) => r.healthy) ? 'healthy' : 'unhealthy',
    checks: results.map((r) => ({
      name: r.name,
      status: r.healthy ? 'pass' : 'fail',
      message: r.message,
    })),
    timestamp: new Date().toISOString(),
  };

  return response;
}

// Common health checks
export const commonHealthChecks = {
  database: (queryFn: () => Promise<void>): HealthCheck => async () => {
    try {
      await queryFn();
      return { name: 'database', healthy: true };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  rabbitmq: (checkFn: () => Promise<boolean>): HealthCheck => async () => {
    try {
      const connected = await checkFn();
      return {
        name: 'rabbitmq',
        healthy: connected,
        message: connected ? undefined : 'Not connected',
      };
    } catch (error) {
      return {
        name: 'rabbitmq',
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
