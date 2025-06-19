// myorg/apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  app.useWebSocketAdapter(new IoAdapter(app) as any);

  app.enableCors({
    origin: [ 'http://localhost:3001', 'http://64.23.225.99:3002', 'https://64.23.225.99:3002', 'https://mycard.runsolutions-services.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
