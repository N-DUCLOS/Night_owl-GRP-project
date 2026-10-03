import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Sale } from "../../sales/entities/sale.entity";

@Entity()
export class Medicine {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "int", default: 0 })
  quantityInStock: number;

  @Column({ type: "int", default: 10 })
  minStockAlertLevel: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "date" })
  expirationDate: Date;

  @Column()
  batchNumber: string;

  @Column()
  supplier: string;

  @OneToMany(() => Sale, (sale) => sale.medicine)
  sales: Sale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}