import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;

  const saleRepository = {
    findOne: jest.fn(),
  };

  const medicineRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const createQueryRunner = () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const dataSource = {
      createQueryRunner,
    } as unknown as DataSource;

    service = new SalesService(
      saleRepository as any,
      medicineRepository as any,
      dataSource,
    );
  });

  it('restores stock when a sale is removed', async () => {
    const sale = {
      id: 'sale-1',
      quantitySold: 3,
      medicine: { id: 'medicine-1' },
    };

    saleRepository.findOne.mockResolvedValue(sale);

    const queryRunner = createQueryRunner();
    queryRunner.manager.findOne.mockResolvedValue({
      id: 'medicine-1',
      quantityInStock: 7,
    });
    queryRunner.manager.save.mockResolvedValue({
      id: 'medicine-1',
      quantityInStock: 10,
    });
    jest.spyOn((service as any).dataSource, 'createQueryRunner').mockReturnValue(queryRunner as any);

    const result = await service.remove('sale-1');

    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantityInStock: 10 }),
    );
    expect(result).toEqual({
      message: 'Sale deleted successfully',
      sale,
    });
  });

  it('rejects invalid sale quantities before any stock change', async () => {
    await expect(
      service.create({ medicineId: 'medicine-1', quantitySold: 0 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when the medicine for a sale cannot be found', async () => {
    saleRepository.findOne.mockResolvedValue({
      id: 'sale-1',
      quantitySold: 2,
      medicine: null,
    });

    await expect(service.remove('sale-1')).rejects.toThrow(NotFoundException);
  });
});
