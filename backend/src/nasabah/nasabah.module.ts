import { Module } from '@nestjs/common';
import { NasabahService } from './nasabah.service';
import { NasabahController } from './nasabah.controller';
import { PasswordVaultService } from '../common/password-vault.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [NasabahController],
  providers: [NasabahService, PasswordVaultService],
  exports: [NasabahService],
})
export class NasabahModule {}
