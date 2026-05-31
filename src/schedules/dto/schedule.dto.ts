import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'uuid-route-id' })        @IsNotEmpty() @IsString()     routeId: string;
  @ApiProperty({ example: 'Argo Bromo Anggrek' })   @IsNotEmpty() @IsString()     vehicleName: string;
  @ApiPropertyOptional({ example: 'KA-001' })        @IsOptional() @IsString()     vehicleCode?: string;
  @ApiProperty({ example: '2025-12-25T08:00:00Z' }) @IsDateString()               departureTime: string;
  @ApiProperty({ example: '2025-12-25T20:00:00Z' }) @IsDateString()               arrivalTime: string;
  @ApiPropertyOptional({ example: 60, default: 0 }) @IsOptional() @IsNumber() @Min(0) totalSeatsEconomy?: number;
  @ApiPropertyOptional({ example: 20, default: 0 }) @IsOptional() @IsNumber() @Min(0) totalSeatsVip?: number;
  @ApiPropertyOptional({ example: 10, default: 0 }) @IsOptional() @IsNumber() @Min(0) totalSeatsExecutive?: number;
  @ApiPropertyOptional({ example: 200000 })          @IsOptional() @IsNumber()     priceEconomy?: number;
  @ApiPropertyOptional({ example: 350000 })          @IsOptional() @IsNumber()     priceVip?: number;
  @ApiPropertyOptional({ example: 600000 })          @IsOptional() @IsNumber()     priceExecutive?: number;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional() @IsOptional() @IsString()     vehicleName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()     vehicleCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() departureTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() arrivalTime?: string;
  @ApiPropertyOptional({ enum: ['scheduled','boarding','departed','arrived','cancelled'] })
  @IsOptional() @IsString() status?: string;
}
