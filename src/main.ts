import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Configuration globale de la validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Configuration CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Autorise localhost, tous les sous-domaines de dev et le domaine prod
      const allowedOrigins = [
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/petricator(-dev)?-\d+\.us-central1\.run\.app$/,
        /^https:\/\/[a-zA-Z0-9-]+-812288085862\.us-central1\.run\.app$/
      ];
      if (!origin || allowedOrigins.some(regex => regex.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
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
