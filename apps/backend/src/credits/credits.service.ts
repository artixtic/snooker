import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditTransactionDto } from './dto/create-credit-transaction.dto';

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: CreateCreditTransactionDto, employeeId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${dto.memberId} not found`);
    }

    const balanceBefore = Number(member.balance);
    let balanceAfter = balanceBefore;

    // Calculate new balance based on transaction type
    switch (dto.type) {
      case 'SALE':
      case 'ADJUSTMENT':
        balanceAfter = balanceBefore + dto.amount;
        // Check credit limit
        if (balanceAfter > Number(member.creditLimit)) {
          throw new BadRequestException(
            `Credit limit exceeded. Available credit: ${Number(member.creditLimit) - balanceBefore}`,
          );
        }
        break;
      case 'PAYMENT':
      case 'REFUND':
        balanceAfter = balanceBefore - dto.amount;
        if (balanceAfter < 0) {
          throw new BadRequestException('Insufficient balance for this transaction');
        }
        break;
    }

    // Create transaction and update member balance in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: {
          memberId: dto.memberId,
          saleId: dto.saleId,
          type: dto.type,
          amount: dto.amount,
          balanceBefore,
          balanceAfter,
          description: dto.description,
          employeeId,
        },
      });

      await tx.member.update({
        where: { id: dto.memberId },
        data: { balance: balanceAfter },
      });

      return transaction;
    });

    return result;
  }

  async getMemberTransactions(memberId: string) {
    return this.prisma.creditTransaction.findMany({
      where: { memberId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        sale: {
          select: {
            id: true,
            receiptNumber: true,
            total: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOutstandingCredits() {
    const members = await this.prisma.member.findMany({
      where: {
        balance: { gt: 0 },
        isActive: true,
      },
      select: {
        id: true,
        memberNumber: true,
        name: true,
        phone: true,
        balance: true,
        creditLimit: true,
      },
      orderBy: { balance: 'desc' },
    });

    const totalOutstanding = members.reduce(
      (sum, member) => sum + Number(member.balance),
      0,
    );

    return {
      members,
      totalOutstanding,
      count: members.length,
    };
  }
}

