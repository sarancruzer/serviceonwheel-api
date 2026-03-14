import { ConsoleLogger, Injectable } from '@nestjs/common'

@Injectable()
export class AppLoggerService extends ConsoleLogger {
  logStructured(
    level: 'log' | 'warn' | 'error' | 'debug' | 'verbose',
    payload: Record<string, unknown>,
  ): void {
    this[level](
      JSON.stringify({
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    )
  }
}
