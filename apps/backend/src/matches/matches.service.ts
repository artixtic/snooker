import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchScoreDto } from './dto/update-match-score.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { MatchStatus, Prisma } from '@prisma/client';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WebSocketGateway))
    private wsGateway: WebSocketGateway,
  ) {}

  async create(createMatchDto: CreateMatchDto) {
    const { tableId, players, gameType = 'snooker', startTime } = createMatchDto;

    // Verify table exists
    const table = await this.prisma.tableSession.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    // Check if table is available
    if (table.status !== 'AVAILABLE') {
      throw new BadRequestException('Table is not available');
    }

    // Create match with players
    const match = await this.prisma.match.create({
      data: {
        tableId,
        gameType,
        status: startTime ? 'SCHEDULED' : 'ACTIVE',
        startTime: startTime ? new Date(startTime) : new Date(),
        score: {},
        players: {
          create: players.map((p, index) => ({
            playerId: p.playerId || null,
            memberId: p.memberId || null,
            seatNumber: p.seatNumber || index + 1,
            score: 0,
          })),
        },
      },
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
      },
    });

    // Update table status if match is active
    if (match.status === 'ACTIVE') {
      await this.prisma.tableSession.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
    }

    return match;
  }

  async findAll(status?: string, tableId?: string) {
    const where: any = {};
    if (status) {
      where.status = status as MatchStatus;
    }
    if (tableId) {
      where.tableId = tableId;
    }

    return this.prisma.match.findMany({
      where,
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
        sale: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
        sale: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return match;
  }

  async updateScore(id: string, updateScoreDto: UpdateMatchScoreDto) {
    const match = await this.findOne(id);

    if (match.status !== 'ACTIVE' && match.status !== 'PAUSED') {
      throw new BadRequestException('Can only update score for active or paused matches');
    }

    const updateData: Prisma.MatchUpdateInput = {};
    
    if (updateScoreDto.score !== undefined) {
      updateData.score = updateScoreDto.score as Prisma.InputJsonValue;
    } else if (match.score !== null) {
      updateData.score = match.score as Prisma.InputJsonValue;
    }
    
    if (updateScoreDto.metadata !== undefined) {
      updateData.metadata = updateScoreDto.metadata as Prisma.InputJsonValue;
    } else if (match.metadata !== null) {
      updateData.metadata = match.metadata as Prisma.InputJsonValue;
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
      },
    });

    // Emit WebSocket event for real-time score update
    if (this.wsGateway) {
      this.wsGateway.emitMatchScoreUpdate(id, updatedMatch.score);
    }

    return updatedMatch;
  }

  async pause(id: string) {
    const match = await this.findOne(id);

    if (match.status !== 'ACTIVE') {
      throw new BadRequestException('Can only pause active matches');
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
      },
    });

    // Emit WebSocket event
    if (this.wsGateway) {
      this.wsGateway.emitMatchStatusUpdate(id, 'PAUSED', updatedMatch);
    }

    return updatedMatch;
  }

  async resume(id: string) {
    const match = await this.findOne(id);

    if (match.status !== 'PAUSED') {
      throw new BadRequestException('Can only resume paused matches');
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
      },
    });

    // Emit WebSocket event
    if (this.wsGateway) {
      this.wsGateway.emitMatchStatusUpdate(id, 'ACTIVE', updatedMatch);
    }

    return updatedMatch;
  }

  async end(id: string, endMatchDto: EndMatchDto) {
    const match = await this.findOne(id);

    if (match.status === 'FINISHED') {
      throw new BadRequestException('Match is already finished');
    }

    // Update player results and scores
    if (endMatchDto.finalScores) {
      const updatePromises = Object.entries(endMatchDto.finalScores).map(
        async ([playerId, score]) => {
          const matchPlayer = match.players.find(
            (p) => p.playerId === playerId || p.memberId === playerId,
          );

          if (matchPlayer) {
            const result = endMatchDto.winnerId === playerId ? 'win' : 'loss';
            await this.prisma.matchPlayer.update({
              where: { id: matchPlayer.id },
              data: { score, result },
            });

            // Update player stats
            const isUser = !!matchPlayer.playerId;
            const entityId = matchPlayer.playerId || matchPlayer.memberId;
            if (entityId) {
              if (isUser) {
                await this.prisma.user.update({
                  where: { id: entityId },
                  data: {
                    totalMatches: { increment: 1 },
                    wins: result === 'win' ? { increment: 1 } : undefined,
                    losses: result === 'loss' ? { increment: 1 } : undefined,
                  },
                });
              } else {
                await this.prisma.member.update({
                  where: { id: entityId },
                  data: {
                    totalMatches: { increment: 1 },
                    wins: result === 'win' ? { increment: 1 } : undefined,
                    losses: result === 'loss' ? { increment: 1 } : undefined,
                  },
                });
              }
            }
          }
        },
      );

      await Promise.all(updatePromises);
    }

    // Update match
    const updateData: Prisma.MatchUpdateInput = {
      status: 'FINISHED',
      endTime: new Date(),
    };
    
    if (endMatchDto.finalScores !== undefined) {
      updateData.score = endMatchDto.finalScores as Prisma.InputJsonValue;
    } else if (match.score !== null) {
      updateData.score = match.score as Prisma.InputJsonValue;
    }
    
    if (endMatchDto.metadata !== undefined) {
      updateData.metadata = endMatchDto.metadata as Prisma.InputJsonValue;
    } else if (match.metadata !== null) {
      updateData.metadata = match.metadata as Prisma.InputJsonValue;
    }

    const updatedMatch = await this.prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
        sale: true,
      },
    });

    // Free up the table
    await this.prisma.tableSession.update({
      where: { id: match.tableId },
      data: { status: 'AVAILABLE' },
    });

    // Emit WebSocket event
    if (this.wsGateway) {
      this.wsGateway.emitMatchEnded(id, updatedMatch);
    }

    return updatedMatch;
  }

  async markPaid(id: string, saleId: string) {
    const match = await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: {
        isPaid: true,
        saleId,
      },
      include: {
        players: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        table: true,
        sale: true,
      },
    });
  }

  async delete(id: string) {
    const match = await this.findOne(id);

    if (match.status === 'ACTIVE' || match.status === 'PAUSED') {
      // Free up the table
      await this.prisma.tableSession.update({
        where: { id: match.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.match.delete({
      where: { id },
    });
  }
}

