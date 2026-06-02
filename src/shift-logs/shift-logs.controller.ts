import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { ShiftLogsService } from './shift-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateShiftLogDto {
  @ApiProperty({ example: 'Handover shift malam, manifest aman.' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ example: 'Normal', enum: ['Normal', 'Delay', 'Overweight', 'Maintenance'] })
  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('Jurnal Shift')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
@Controller('shift-logs')
export class ShiftLogsController {
  constructor(private svc: ShiftLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua jurnal catatan shift' })
  getLogs() {
    return this.svc.getLogs();
  }

  @Post()
  @ApiOperation({ summary: 'Tambah catatan shift baru' })
  createLog(@Body() dto: CreateShiftLogDto, @CurrentUser() user: any) {
    return this.svc.createLog(dto, user);
  }
}
