import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check memory heap (max 200MB)
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      // Check memory RSS (max 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness() {
    // Liveness probe - just checks if the service is running
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

    return this.health.check([
      // Check memory
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      // Check RabbitMQ connection
      () =>
        this.microservice.pingCheck('rabbitmq', {
          transport: Transport.RMQ,
          options: {
            urls: [rabbitmqUrl],
          },
        }),
    ]);
  }
}
