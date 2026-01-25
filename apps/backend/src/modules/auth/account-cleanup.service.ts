import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from './user.service';

/**
 * Hesap temizleme cron job servisi
 * Her gece saat 01:00'de (Türkiye saati) çalışır
 */
@Injectable()
export class AccountCleanupService {
  private readonly logger = new Logger(AccountCleanupService.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Her gece 01:00'de (Europe/Istanbul) silinmek üzere işaretlenen hesapları kalıcı olarak sil
   */
  @Cron('0 1 * * *', { timeZone: 'Europe/Istanbul' })
  async handleDeletedAccountsCleanup(): Promise<void> {
    this.logger.log('Starting deleted accounts cleanup...');

    try {
      const result = await this.userService.hardDeleteMarkedAccounts();
      this.logger.log(
        `Cleanup completed. Deleted ${result.affected} accounts.`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup deleted accounts', error);
    }
  }
}
