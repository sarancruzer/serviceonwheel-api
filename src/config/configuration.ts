import { appConfig } from './app.config'
import { authConfig } from './auth.config'
import { awsConfig } from './aws.config'
import { databaseConfig } from './database.config'
import { mailConfig } from './mail.config'
import { securityConfig } from './security.config'

export const configuration = [
  appConfig,
  authConfig,
  awsConfig,
  databaseConfig,
  mailConfig,
  securityConfig,
]

export { appConfig, authConfig, awsConfig, databaseConfig, mailConfig, securityConfig }
