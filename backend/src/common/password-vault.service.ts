import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class PasswordVaultService {
  constructor(private readonly config: ConfigService) {}

  private getKey(): Buffer {
    const key = this.config.get<string>('PASSWORD_VAULT_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'PASSWORD_VAULT_KEY tidak dikonfigurasi',
      );
    }
    const buffer = Buffer.from(key, 'base64');
    if (buffer.length !== 32) {
      throw new InternalServerErrorException(
        'PASSWORD_VAULT_KEY harus 32 byte (base64)',
      );
    }
    return buffer;
  }

  encrypt(plain: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  }

  decrypt(encrypted: string): string {
    const [ivB64, authTagB64, ciphertextB64] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.getKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  }
}
