import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

const STAFF = [Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT];
const ALL   = [...STAFF, Role.USER];

@ApiTags('🎟️ Tiket')
@Controller('tickets')
export class TicketsController {
  constructor(private svc: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar tiket' })
  @ApiQuery({ name:'schedule_id',    required:false })
  @ApiQuery({ name:'seat_class',     required:false, enum:['ekonomi','vip','eksekutif'] })
  @ApiQuery({ name:'status',         required:false, enum:['tersedia','dipesan'] })
  @ApiQuery({ name:'transport_type', required:false, enum:['kereta','pesawat'] })
  getAll(@Query('schedule_id') s?,@Query('seat_class') c?,@Query('status') st?,@Query('transport_type') t?) {
    return this.svc.getTickets(s,c,st,t);
  }

  @Get('seats/:scheduleId')
  @ApiOperation({ summary: 'Peta kursi untuk satu jadwal' })
  getSeatMap(@Param('scheduleId') id: string) { return this.svc.getSeatMap(id); }

  @Get('passengers/:scheduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daftar penumpang (petugas/admin)' })
  getPassengers(@Param('scheduleId') id: string, @CurrentUser() user: any) {
    return this.svc.getPassengers(id, user.role);
  }

  @Patch(':orderId/boarding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update status boarding penumpang (petugas/admin)' })
  updateBoardingStatus(
    @Param('orderId') orderId: string,
    @Body() dto: { boardingStatus: string },
    @CurrentUser() user: any
  ) {
    return this.svc.updateBoardingStatus(orderId, dto.boardingStatus, user.role);
  }

  @Patch(':orderId/baggage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update timbangan bagasi penumpang (petugas/admin)' })
  updateBaggageWeight(
    @Param('orderId') orderId: string,
    @Body() dto: { baggageWeight: number },
    @CurrentUser() user: any
  ) {
    return this.svc.updateBaggageWeight(orderId, dto.baggageWeight, user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ALL)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail tiket' })
  getById(@Param('id') id: string) { return this.svc.getById(id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah tiket manual' })
  create(@Body() dto: any, @CurrentUser() user: any) { return this.svc.create(dto, user.role); }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tiket' })
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) { return this.svc.update(id, dto, user.role); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus tiket' })
  delete(@Param('id') id: string, @CurrentUser() user: any) { return this.svc.delete(id, user.role); }
}
