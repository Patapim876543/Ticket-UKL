import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto, TopupDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('👑 Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Statistik sistem' })
  getDashboard() { return this.adminService.getDashboard(); }

  @Get('users')
  @ApiOperation({ summary: 'Daftar semua user' })
  @ApiQuery({ name: 'role',   required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  getAllUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.adminService.getAllUsers(role, search, page, limit); }

  @Get('users/:id')
  @ApiOperation({ summary: 'Detail user by ID' })
  getUserById(@Param('id') id: string) { return this.adminService.getUserById(id); }

  @Post('users')
  @ApiOperation({ summary: 'Buat user baru' })
  createUser(@Body() dto: CreateUserDto) { return this.adminService.createUser(dto); }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.adminService.updateUser(id, dto); }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Hapus user' })
  deleteUser(@Param('id') id: string, @CurrentUser() user: any) { return this.adminService.deleteUser(id, user.id); }

  @Post('users/:id/topup')
  @ApiOperation({ summary: 'Topup saldo user' })
  topup(@Param('id') id: string, @Body() dto: TopupDto, @CurrentUser() user: any) { return this.adminService.topupBalance(id, dto, user.id); }

  @Get('orders')
  @ApiOperation({ summary: 'Semua data pembelian' })
  @ApiQuery({ name: 'transport_type', required: false, enum: ['kereta', 'pesawat'] })
  @ApiQuery({ name: 'status', required: false })
  getAllOrders(
    @Query('transport_type') transportType?: string,
    @Query('status') status?: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.adminService.getAllOrders(transportType, status, page, limit); }
}
