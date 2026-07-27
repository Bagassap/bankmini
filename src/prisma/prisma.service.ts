import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // DATABASE_URL dibaca di sini (saat Nest benar-benar meng-instantiate
    // provider ini), bukan di module scope — ConfigModule.forRoot() baru
    // mengisi process.env saat decorator AppModule dievaluasi, yang terjadi
    // SETELAH seluruh import (termasuk file ini) selesai dijalankan.
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
