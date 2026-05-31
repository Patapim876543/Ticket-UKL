import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('🛤️ Rute Perjalanan')
@Controller('routes')
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua rute' })
  @ApiQuery({ name: 'transport_type', required: false, enum: ['kereta','pesawat'] })
  @ApiQuery({ name: 'origin',         required: false })
  @ApiQuery({ name: 'destination',    required: false })
  getAll(@Query('transport_type') t?: string, @Query('origin') o?: string, @Query('destination') d?: string) {
    return this.routesService.getAll(t, o, d);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah rute baru' })
  create(@Body() dto: CreateRouteDto, @CurrentUser() user: any) {
    return this.routesService.create(dto, user.role);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update rute' })
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto, @CurrentUser() user: any) {
    return this.routesService.update(id, dto, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus rute' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.routesService.delete(id, user.role);
  }
}
