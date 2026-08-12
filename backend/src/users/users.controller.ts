import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StaffOnlyGuard } from '../auth/staff-only.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { resolveStaffId } from '../auth/resolve-staff-id';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
@UseGuards(StaffOnlyGuard, RolesGuard)
@Roles(Role.superadmin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/password')
  async getPassword(@Param('id') id: string) {
    const password = await this.usersService.getDecryptedPassword(id);
    return { password };
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (resolveStaffId(user) === id) {
      throw new BadRequestException('Tidak dapat menghapus akun sendiri');
    }
    return this.usersService.delete(id);
  }
}
