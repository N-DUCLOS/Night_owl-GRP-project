import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    const { medicineId, quantitySold } = createSaleDto;

    if (quantitySold <= 0) {
      throw new BadRequestException('Quantity sold must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const medicine = await queryRunner.manager.findOne(Medicine, {
        where: { id: medicineId },
      });

      if (!medicine) {
        throw new NotFoundException('Medicine not found');
      }

      if (medicine.quantityInStock < quantitySold) {
        throw new BadRequestException('Insufficient stock available');
      }

      medicine.quantityInStock -= quantitySold;
      await queryRunner.manager.save(medicine);

      const totalPrice = Number(medicine.price) * quantitySold;

      const sale = queryRunner.manager.create(Sale, {
        medicine,
        quantitySold,
        totalPrice,
      });

      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();

      return {
        message: 'Sale recorded successfully',
        sale: savedSale,
        remainingStock: medicine.quantityInStock,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  findAll() {
    return this.saleRepository.find({
      relations: {
        medicine: true,
      },
    });
  }

  async findOne(id: string) {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: {
        medicine: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async remove(id: string) {
    const sale = await this.findOne(id);

    if (!sale.medicine) {
      throw new NotFoundException(`Medicine for sale ${id} was not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const medicine = await queryRunner.manager.findOne(Medicine, {
        where: { id: sale.medicine.id },
      });

      if (!medicine) {
        throw new NotFoundException('Medicine not found');
      }

      medicine.quantityInStock += sale.quantitySold;
      await queryRunner.manager.save(medicine);
      await queryRunner.manager.remove(Sale, sale);
      await queryRunner.commitTransaction();

      return {
        message: 'Sale deleted successfully',
        sale,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}