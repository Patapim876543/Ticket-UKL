import { Controller, Get, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

const ALL = [Role.ADMIN, Role.PETUGAS_KERETA, Role.PETUGAS_PESAWAT, Role.USER];

@ApiTags('👤 Fitur User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get('balance')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Cek saldo (user only)' })
  getBalance(@CurrentUser() u: any) { return this.svc.getBalance(u.id); }

  @Get('transactions')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Riwayat transaksi saldo (user only)' })
  @ApiQuery({ name:'type', required:false, enum:['topup','pembelian','refund'] })
  getTransactions(@CurrentUser() u: any, @Query('type') type?, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page=1, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit=20) {
    return this.svc.getTransactions(u.id, type, page, limit);
  }

  @Get('cs-contact')
  @Roles(...ALL)
  @ApiOperation({ summary: 'Kontak customer service' })
  @ApiQuery({ name:'transport_type', required:false, enum:['kereta','pesawat'] })
  getCSContact(@Query('transport_type') t?) { return this.svc.getCSContact(t); }

  @Get('search-tickets')
  @Roles(...ALL)
  @ApiOperation({ summary: 'Cari tiket tersedia' })
  @ApiQuery({ name:'transport_type', required:true,  enum:['kereta','pesawat'] })
  @ApiQuery({ name:'origin',         required:true,  example:'Malang' })
  @ApiQuery({ name:'destination',    required:true,  example:'Surabaya' })
  @ApiQuery({ name:'date',           required:false, description:'YYYY-MM-DD' })
  @ApiQuery({ name:'seat_class',     required:false, enum:['ekonomi','vip','eksekutif'] })
  searchTickets(@Query('transport_type') t: string, @Query('origin') o: string, @Query('destination') d: string, @Query('date') date?, @Query('seat_class') sc?) {
    return this.svc.searchTickets(t, o, d, date, sc);
  }
}
