import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSaleDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  medicineId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantitySold: number;
}