import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import Handlebars from 'handlebars'
import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import * as path from 'path'
import { mailConfig } from '../config/mail.config'
import { AppLoggerService } from '../common/services/app-logger.service'

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter
  private readonly resetPasswordTemplate: Handlebars.TemplateDelegate<Record<string, unknown>>

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
    private readonly logger: AppLoggerService,
  ) {
    this.transporter =
      this.config.host && this.config.port
        ? nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth:
              this.config.user && this.config.pass
                ? {
                    user: this.config.user,
                    pass: this.config.pass,
                  }
                : undefined,
          })
        : nodemailer.createTransport({
            jsonTransport: true,
          })

    const templatePath = path.join(__dirname, 'templates', 'reset-password.hbs')
    const templateSource = fs.readFileSync(templatePath, 'utf8')
    this.resetPasswordTemplate = Handlebars.compile(templateSource)
  }

  async sendPasswordResetEmail(params: {
    email: string
    name: string
    token: string
    expiresInMinutes: number
  }): Promise<void> {
    const resetUrl = `${this.config.resetPasswordUrlBase}?token=${encodeURIComponent(params.token)}`
    const html = this.resetPasswordTemplate({
      customerName: params.name,
      resetUrl,
      token: params.token,
      expiresInMinutes: params.expiresInMinutes,
      appName: this.config.fromName,
    })

    await this.transporter.sendMail({
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: params.email,
      subject: 'Reset your ServiceOnWheel password',
      html,
    })

    this.logger.logStructured('log', {
      event: 'mail.password_reset.sent',
      email: params.email,
    })
  }
}
