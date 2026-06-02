import { Module } from '@nestjs/common';
import { PrismaModule }    from './prisma/prisma.module';
import { AuthModule }      from './auth/auth.module';
import { AdminModule }     from './admin/admin.module';
import { RoutesModule }    from './routes/routes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TicketsModule }   from './tickets/tickets.module';
import { OrdersModule }    from './orders/orders.module';
import { UsersModule }     from './users/users.module';
import { ShiftLogsModule } from './shift-logs/shift-logs.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    RoutesModule,
    SchedulesModule,
    TicketsModule,
    OrdersModule,
    UsersModule,
    ShiftLogsModule,
  ],
})
export class AppModule {}
