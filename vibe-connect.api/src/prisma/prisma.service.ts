import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. PostgreSQL için bağlantı havuzu (pool) oluşturuyoruz
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString,
      // Bu komut PostgreSQL'e bağlantı anında şemayı vibeconnect olarak sabitlemesini söyler
      options: '-c search_path=vibeconnect',
    });
    const adapter = new PrismaPg(pool);

    // 3. Prisma'ya "Bu adaptörü kullan" diyerek motoru ateşliyoruz!
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
