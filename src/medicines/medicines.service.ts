import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Medicine } from './entities/medicine.entity';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@Injectable()
export class MedicinesService {
  private readonly logger = new Logger(MedicinesService.name);

  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
  ) {}

  async create(createMedicineDto: CreateMedicineDto): Promise<Medicine> {
    const medicine = this.medicineRepository.create(createMedicineDto);
    return this.medicineRepository.save(medicine);
  }

  findAll(): Promise<Medicine[]> {
    return this.medicineRepository.find();
  }

  async findOne(id: string): Promise<Medicine> {
    const medicine = await this.medicineRepository.findOne({ where: { id } });

    if (!medicine) {
      throw new NotFoundException(`Medicine with ID ${id} not found`);
    }

    return medicine;
  }

  async update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<Medicine> {
    const medicine = await this.findOne(id);
    Object.assign(medicine, updateMedicineDto);
    return this.medicineRepository.save(medicine);
  }

  async remove(id: string): Promise<Medicine> {
    const medicine = await this.findOne(id);
    return this.medicineRepository.remove(medicine);
  }

  // Run automatically every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkStockAndExpirations() {
    this.logger.log('Running daily stock and expiration check...');
    await this.checkLowStock();
    await this.checkExpirations();
  }

  // Feature 4: Low Stock Alert
  async checkLowStock() {
    const medicines: Medicine[] = await this.medicineRepository.find();
    const lowStockItems: Medicine[] = medicines.filter(
      (med: Medicine) => med.quantityInStock <= med.minStockAlertLevel,
    );

    lowStockItems.forEach((med: Medicine) => {
      this.logger.warn(
        `Low Stock Alert: ${med.name} has only ${med.quantityInStock} items remaining.`,
      );
    });

    return lowStockItems;
  }

  // Feature 3: Expiration Alert (30, 14, 7, 1 days)
  async checkExpirations() {
    const alertThresholdsDays = [30, 14, 7, 1];
    const today = new Date();

    for (const days of alertThresholdsDays) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + days);

      const formattedDate = targetDate.toISOString().split('T')[0];

      const expiringMedicines: Medicine[] = await this.medicineRepository
        .createQueryBuilder('medicine')
        .where('DATE(medicine.expirationDate) = :formattedDate', {
          formattedDate,
        })
        .getMany();

      expiringMedicines.forEach((med: Medicine) => {
        this.logger.warn(
          `Warning: ${med.name} Batch #${med.batchNumber} will expire in ${days} day(s) on ${formattedDate}.`,
        );
      });
    }
  }
}