import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap().catch((err) => {
  console.error('Sunucu başlatılırken kritik bir hata oluştu:', err);
});
