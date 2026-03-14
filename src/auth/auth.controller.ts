import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { RequestWithContext } from '../common/interfaces/request-context.interface'
import type { AuthenticatedUser } from '../common/interfaces/request-context.interface'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AuthService } from './auth.service'
import {
  AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  MeResponseDto,
  MessageResponseDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a customer account' })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() payload: RegisterDto, @Req() request: RequestWithContext) {
    return this.authService.register(payload, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    })
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() payload: LoginDto, @Req() request: RequestWithContext) {
    return this.authService.login(payload, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    })
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() payload: RefreshDto, @Req() request: RequestWithContext) {
    return this.authService.refresh(payload, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke the refresh token' })
  @ApiOkResponse({ type: MessageResponseDto })
  logout(@Body() payload: LogoutDto) {
    return this.authService.logout(payload)
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Trigger password reset email without leaking user existence' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword(payload)
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with one-time token' })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for the authenticated user' })
  @ApiOkResponse({ type: MessageResponseDto })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() payload: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, payload)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: MeResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.sub)
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: MeResponseDto })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() payload: UpdateProfileDto) {
    return this.authService.updateMe(user.sub, payload)
  }
}
