import { Controller, Get, Post, Body, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

const ALL = [Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT, Role.USER];

@ApiTags('🛒 Pemesanan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL)
@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Get('my')
  @ApiOperation({ summary: 'Riwayat pesanan saya' })
  @ApiQuery({ name:'status', required:false })
  getMyOrders(@CurrentUser() u: any, @Query('status') status?, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page=1, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit=10) {
    return this.svc.getMyOrders(u.id, status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pesanan' })
  getById(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getById(id, u); }

  @Post()
  @ApiOperation({ summary: 'Beli tiket' })
  @ApiBody({ schema: { example: { ticketId:'uuid', passengerName:'Nama', passengerIdNumber:'3578xxx', passengerPhone:'082xx', buyerUserId:'uuid (petugas/admin only)', notes:'opsional' } } })
  create(@Body() dto: any, @CurrentUser() u: any) { return this.svc.create(dto, u); }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund tiket' })
  @ApiBody({ schema: { example: { refund_reason:'Alasan refund' } } })
  refund(@Param('id') id: string, @Body() body: any, @CurrentUser() u: any) {
    return this.svc.refund(id, u, body.refund_reason);
  }
}
