import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration globale de la validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Configuration CORS
  app.enableCors();
  
  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Papi Peblob API')
    .setDescription('API développée avec NestJS')
    .setVersion('1.0')
    .addTag('api')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api`);
}
bootstrap();
