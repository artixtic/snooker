import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRateRuleDto } from './dto/create-rate-rule.dto';
import { UpdateRateRuleDto } from './dto/update-rate-rule.dto';

@Injectable()
export class TableRateRulesService {
  constructor(private prisma: PrismaService) {}

  async create(createRateRuleDto: CreateRateRuleDto) {
    if (createRateRuleDto.tableId) {
      const table = await this.prisma.tableSession.findUnique({
        where: { id: createRateRuleDto.tableId },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${createRateRuleDto.tableId} not found`);
      }
    }

    return this.prisma.tableRateRule.create({
      data: createRateRuleDto,
    });
  }

  async findAll(tableId?: string, isActive?: boolean) {
    const where: any = {};

    if (tableId) {
      where.tableId = tableId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.tableRateRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.tableRateRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Rate rule with ID ${id} not found`);
    }

    return rule;
  }

  async update(id: string, updateRateRuleDto: UpdateRateRuleDto) {
    await this.findOne(id);

    return this.prisma.tableRateRule.update({
      where: { id },
      data: updateRateRuleDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tableRateRule.delete({ where: { id } });
  }

  async getApplicableRate(
    tableId: string,
    dateTime?: Date,
  ): Promise<number> {
    const now = dateTime || new Date();
    const dayOfWeek = now.getDay();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Get all active rules for this table or all tables, ordered by priority
    const rules = await this.prisma.tableRateRule.findMany({
      where: {
        isActive: true,
        OR: [{ tableId }, { tableId: null }],
      },
      orderBy: { priority: 'desc' },
    });

    // Find the first applicable rule
    for (const rule of rules) {
      let applicable = true;

      // Check time-based rules
      if (rule.ruleType === 'TIME_BASED' || rule.ruleType === 'PEAK_HOURS') {
        if (rule.startTime && rule.endTime) {
          applicable = applicable && time >= rule.startTime && time <= rule.endTime;
        }
      }

      // Check day-based rules
      if (rule.ruleType === 'DAY_BASED') {
        if (rule.daysOfWeek) {
          const days = rule.daysOfWeek.split(',').map((d) => parseInt(d.trim()));
          applicable = applicable && days.includes(dayOfWeek);
        }
      }


      if (applicable) {
        return Number(rule.ratePerHour);
      }
    }

    // Return default rate from table if no rule matches
    const table = await this.prisma.tableSession.findUnique({
      where: { id: tableId },
    });

    return table ? Number(table.ratePerHour) : 0;
  }
}

