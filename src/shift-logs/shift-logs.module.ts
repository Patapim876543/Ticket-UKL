import { Module } from '@nestjs/common';
import { ShiftLogsController } from './shift-logs.controller';
import { ShiftLogsService } from './shift-logs.service';

@Module({
  controllers: [ShiftLogsController],
  providers: [ShiftLogsService],
})
export class ShiftLogsModule {}
