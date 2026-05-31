import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('📅 Jadwal')
@Controller('schedules')
export class SchedulesController {
  constructor(private svc: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar jadwal (filter: transport_type, origin, destination, date)' })
  @ApiQuery({ name:'transport_type', required:false, enum:['kereta','pesawat'] })
  @ApiQuery({ name:'origin',         required:false })
  @ApiQuery({ name:'destination',    required:false })
  @ApiQuery({ name:'date',           required:false, description:'Format: YYYY-MM-DD' })
  getAll(@Query('transport_type') t?,@Query('origin') o?,@Query('destination') d?,@Query('date') date?) {
    return this.svc.getAll(t,o,d,date);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat jadwal baru + auto-generate kursi' })
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: any) {
    return this.svc.create(dto, user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update jadwal' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @CurrentUser() user: any) {
    return this.svc.update(id, dto, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus jadwal' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.delete(id, user.role);
  }
}
