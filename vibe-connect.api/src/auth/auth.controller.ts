import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  // İŞTE YENİ GİZLİ ROTAMIZ
  @UseGuards(JwtAuthGuard) // Kapıdaki güvenlik görevlisi
  @Get('profile')
  getProfile(@Request() req: { user: { id: string; username: string } }) {
    return {
      mesaj: 'Tebrikler, güvenlik duvarını aştın!',
      kullaniciBilgileri: req.user,
    };
  }
}
