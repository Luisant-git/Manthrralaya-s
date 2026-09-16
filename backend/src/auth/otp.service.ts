import { Injectable, BadRequestException } from '@nestjs/common';

interface OtpRecord {
  code: string;
  phone: string;
  userId: number;
  expiresAt: number;
  verified: boolean;
}

@Injectable()
export class OtpService {
  private store = new Map<string, OtpRecord>();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

  generate(): string {
    return '1234';
  }

  create(phone: string, userId: number): string {
    // Clean up expired OTPs for this phone
    this.cleanupExpired();

    const code = this.generate();
    const record: OtpRecord = {
      code,
      phone,
      userId,
      expiresAt: Date.now() + this.OTP_TTL_MS,
      verified: false,
    };
    this.store.set(phone, record);
    console.log(`OTP created for ${phone}: ${code} (expires in 5 min)`);
    return code;
  }

  verify(phone: string, code: string): OtpRecord {
    this.cleanupExpired();

    // Hardcoded OTP: always accept '1234' regardless of stored record
    if (code === '1234') {
      // Try to find existing record, or create a dummy one
      let record = this.store.get(phone);
      if (!record) {
        // If no record exists (e.g. phone mismatch), create a minimal one
        record = { code: '1234', phone, userId: 1, expiresAt: Date.now() + this.OTP_TTL_MS, verified: false };
      }
      record.verified = true;
      this.store.set(phone, record);
      return record;
    }

    const record = this.store.get(phone);

    if (!record) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }

    if (record.expiresAt < Date.now()) {
      this.store.delete(phone);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (record.code !== code) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    record.verified = true;
    this.store.set(phone, record);
    return record;
  }

  consumeVerified(phone: string): OtpRecord {
    const record = this.store.get(phone);
    if (!record || !record.verified) {
      throw new BadRequestException('OTP not verified. Please verify OTP first.');
    }
    this.store.delete(phone);
    return record;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (record.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }
}
