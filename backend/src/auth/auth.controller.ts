import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { NasabahService } from '../nasabah/nasabah.service';
import type { JwtPayload } from './jwt-payload.interface';

const ACCESS_TOKEN_COOKIE = 'access_token';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

function extractToken(req: Request): string | undefined {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    ACCESS_TOKEN_COOKIE
  ];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly nasabahService: NasabahService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    const result = await this.authService.login(dto);
    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, cookieOptions());
    return result;
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(extractToken(req));
    res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions());
    return { message: 'Berhasil logout' };
  }

  @Get('me')
  async me(
    @CurrentUser() user: JwtPayload,
  ): Promise<JwtPayload & { mustChangePassword?: boolean }> {
    if (user.accountType === 'nasabah') {
      const nasabah = await this.nasabahService.findById(user.id);
      return { ...user, mustChangePassword: nasabah.mustChangePassword };
    }
    return user;
  }
}
