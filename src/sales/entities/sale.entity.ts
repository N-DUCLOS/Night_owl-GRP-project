import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Medicine } from '../../medicines/entities/medicine.entity';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantitySold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ManyToOne(() => Medicine, (medicine) => medicine.sales, {
    onDelete: 'CASCADE',
  })
  medicine: Medicine;

  @CreateDateColumn()
  createdAt: Date;
}