import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { AppLoggerService } from './common/services/app-logger.service'
import { appConfig } from './config/app.config'
import { securityConfig } from './config/security.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  const logger = app.get(AppLoggerService)
  const appSettings = app.get(appConfig.KEY)
  const securitySettings = app.get(securityConfig.KEY)

  app.useLogger(logger)
  app.use(helmet())
  app.enableCors({
    origin: securitySettings.corsOrigins.length > 0 ? securitySettings.corsOrigins : true,
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ServiceOnWheel API')
    .setDescription('Enterprise backend API for the ServiceOnWheel local services marketplace')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup(appSettings.swaggerPath, app, document)

  await app.listen(appSettings.port)
  logger.logStructured('log', {
    event: 'application.booted',
    port: appSettings.port,
    swaggerPath: appSettings.swaggerPath,
  })
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap')
  if (error instanceof Error) {
    logger.error(error.message, error.stack)
  } else {
    logger.error(String(error))
  }
  process.exit(1)
})
