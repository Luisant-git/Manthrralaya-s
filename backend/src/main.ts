import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const uploadsDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

 
  const config = new DocumentBuilder()
    .setTitle('Manthrralaya API')
    .setDescription('API documentation for Manthrralaya backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);           //http://localhost:3000/api


  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();