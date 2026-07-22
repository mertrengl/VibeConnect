import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  UseGuards,
  Request,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from './dtos/search_users.dto';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dtos/change_password.dto';
import { UpdateProfileDto } from './dtos/update_profile.dto';
import 'multer';

type AuthenticatedRequest = {
  user: {
    id: string;
    username: string;
  };
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(
    @Request() req: AuthenticatedRequest,
    @Query() dto: SearchUsersDto,
  ) {
    return this.usersService.searchUsers(dto.q, req.user.id);
  }

  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me/password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changeUserPassword(req.user.id, dto);
  }

  @Patch('me')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateUserProfile(req.user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Sadece JPG, JPEG, PNG ve WEBP formatları desteklenmektedir.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @Delete('avatar')
  async removeAvatar(@Request() req: AuthenticatedRequest) {
    return this.usersService.removeAvatar(req.user.id);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}
