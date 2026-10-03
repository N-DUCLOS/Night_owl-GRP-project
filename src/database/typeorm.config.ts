import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

import { Medicine } from '../medicines/entities/medicine.entity';
import { Sale } from '../sales/entities/sale.entity';

dotenv.config();

let typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DB_URL,
  entities: [Medicine, Sale],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false, // Required for Neon PostgreSQL connection
  },
};

if (!process.env.DB_URL) {
  console.log('DB_URL is not found in environment variables');
}

export { typeOrmConfig };
export const datasource = new DataSource(typeOrmConfig as DataSourceOptions);