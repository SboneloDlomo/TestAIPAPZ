import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug'],
  });
  app.enableCors();
  const options = new DocumentBuilder()
    .setTitle('Apzor Know-Your-Customer API')
    .addBasicAuth()
    .setDescription(
      `<p>
    The Apzor Know-Your-Customer API (apz-kyc-api) is a RESTful API that exists to provide...
    </p>
    `,
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000/', 'Local environment')
    .addServer('https://api.kyc.qa.tenettechnology.co.za', 'QA environment')
    .addServer(
      'https://api.kyc.prod.tenettechnology.co.za',
      'Production environment',
    )
    .addTag('APZ-KYC-API')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
