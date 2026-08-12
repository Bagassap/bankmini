import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordVaultService } from '../common/password-vault.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PasswordVaultService],
  exports: [UsersService],
})
export class UsersModule {}
