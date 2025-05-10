import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Document Management')
  .setDescription('The document management API description')
  .setVersion('1.0')
  .addServer('http://localhost:3000', 'Local development server')
  .setContact(
    'Syahrul Bhudi Ferdiansyah',
    'https://ryuko.my,id',
    'syahrul4w@gmail.com',
  )
  .addBearerAuth()
  .build();
