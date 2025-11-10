import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { AdvanceWinnerDto } from './dto/advance-winner.dto';
import { TournamentStatus, TournamentFormat } from '@prisma/client';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(createTournamentDto: CreateTournamentDto, createdById: string) {
    const { participantIds, ...tournamentData } = createTournamentDto;

    // Create tournament
    const tournament = await this.prisma.tournament.create({
      data: {
        ...tournamentData,
        status: tournamentData.status || 'DRAFT',
        createdById,
        bracket: this.generateInitialBracket(tournamentData.format, participantIds?.length || 0),
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        participants: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
      },
    });

    // Add participants if provided
    if (participantIds && participantIds.length > 0) {
      await this.addParticipants(tournament.id, participantIds);
    }

    return this.findOne(tournament.id);
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status as TournamentStatus;
    }

    return this.prisma.tournament.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        participants: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        matches: {
          include: {
            match: {
              include: {
                players: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, username: true },
        },
        participants: {
          include: {
            player: {
              select: { id: true, name: true, username: true },
            },
            member: {
              select: { id: true, name: true, memberNumber: true },
            },
          },
        },
        matches: {
          include: {
            match: {
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
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }

    return tournament;
  }

  async addParticipant(id: string, addParticipantDto: AddParticipantDto) {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'DRAFT' && tournament.status !== 'REGISTRATION') {
      throw new BadRequestException('Can only add participants during draft or registration phase');
    }

    // Check if participant already exists
    const existing = await this.prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId: id,
        OR: [
          { playerId: addParticipantDto.playerId || null },
          { memberId: addParticipantDto.memberId || null },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Participant already registered');
    }

    return this.prisma.tournamentPlayer.create({
      data: {
        tournamentId: id,
        playerId: addParticipantDto.playerId || null,
        memberId: addParticipantDto.memberId || null,
        seed: addParticipantDto.seed || null,
      },
      include: {
        player: {
          select: { id: true, name: true, username: true },
        },
        member: {
          select: { id: true, name: true, memberNumber: true },
        },
      },
    });
  }

  async addParticipants(tournamentId: string, participantIds: string[]) {
    const participants = await Promise.all(
      participantIds.map(async (participantId) => {
        // Determine if it's a user or member
        const user = await this.prisma.user.findUnique({ where: { id: participantId } });
        const member = user ? null : await this.prisma.member.findUnique({ where: { id: participantId } });

        if (!user && !member) {
          throw new NotFoundException(`Participant with ID ${participantId} not found`);
        }

        return {
          tournamentId,
          playerId: user ? participantId : null,
          memberId: member ? participantId : null,
        };
      }),
    );

    return this.prisma.tournamentPlayer.createMany({
      data: participants,
      skipDuplicates: true,
    });
  }

  async start(id: string) {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'DRAFT' && tournament.status !== 'REGISTRATION') {
      throw new BadRequestException('Tournament can only be started from draft or registration status');
    }

    if (tournament.participants.length < 2) {
      throw new BadRequestException('Tournament needs at least 2 participants');
    }

    // Generate bracket and create initial matches
    const bracket = this.generateBracket(tournament.format, tournament.participants);
    
    // Update tournament with bracket and status
    const updated = await this.prisma.tournament.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        bracket,
        startDate: new Date(),
      },
    });

    // Create initial round matches based on bracket
    await this.createBracketMatches(id, bracket);

    return this.findOne(id);
  }

  async advanceWinner(id: string, advanceWinnerDto: AdvanceWinnerDto) {
    const tournament = await this.findOne(id);

    if (tournament.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Tournament must be in progress to advance winners');
    }

    const { matchId, winnerId, nextMatchId } = advanceWinnerDto;

    // Find the tournament match
    const tournamentMatch = tournament.matches.find((tm) => tm.matchId === matchId);
    if (!tournamentMatch) {
      throw new NotFoundException('Match not found in tournament');
    }

    // Update participant status
    const winner = tournament.participants.find(
      (p) => p.playerId === winnerId || p.memberId === winnerId,
    );

    if (winner) {
      await this.prisma.tournamentPlayer.update({
        where: { id: winner.id },
        data: { status: 'active' },
      });

      // Mark others as eliminated
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true },
      });

      if (match) {
        const losers = match.players.filter(
          (p) => p.playerId !== winnerId && p.memberId !== winnerId,
        );

        for (const loser of losers) {
          const participant = tournament.participants.find(
            (p) =>
              (p.playerId && p.playerId === loser.playerId) ||
              (p.memberId && p.memberId === loser.memberId),
          );

          if (participant) {
            await this.prisma.tournamentPlayer.update({
              where: { id: participant.id },
              data: { status: 'eliminated' },
            });
          }
        }
      }
    }

    // If there's a next match, create it or update it
    if (nextMatchId) {
      // Logic to add winner to next match
      // This would depend on bracket structure
    }

    // Check if tournament is complete
    const activeParticipants = tournament.participants.filter((p) => p.status === 'active');
    if (activeParticipants.length === 1) {
      // Tournament complete
      await this.prisma.tournamentPlayer.update({
        where: { id: activeParticipants[0].id },
        data: { status: 'winner' },
      });

      await this.prisma.tournament.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
        },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const tournament = await this.findOne(id);

    if (tournament.status === 'IN_PROGRESS') {
      throw new BadRequestException('Cannot delete tournament in progress');
    }

    return this.prisma.tournament.delete({
      where: { id },
    });
  }

  private generateInitialBracket(format: TournamentFormat, participantCount: number): any {
    // Generate initial bracket structure based on format
    return {
      format,
      rounds: [],
      participants: participantCount,
    };
  }

  private generateBracket(format: TournamentFormat, participants: any[]): any {
    // Generate bracket based on format
    if (format === 'SINGLE_ELIMINATION') {
      return this.generateSingleEliminationBracket(participants);
    }
    // Add other formats as needed
    return { format, rounds: [] };
  }

  private generateSingleEliminationBracket(participants: any[]): any {
    const rounds: any[] = [];
    let currentRound = participants.map((p, index) => ({
      id: `match-${index}`,
      players: [p],
    }));

    while (currentRound.length > 1) {
      rounds.push(currentRound);
      const nextRound: any[] = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        nextRound.push({
          id: `match-${rounds.length}-${i / 2}`,
          players: currentRound.slice(i, i + 2).map((m) => m.players[0]),
        });
      }
      currentRound = nextRound;
    }

    rounds.push(currentRound); // Final round

    return {
      format: 'SINGLE_ELIMINATION',
      rounds,
    };
  }

  private async createBracketMatches(tournamentId: string, bracket: any) {
    // Create matches for first round
    if (bracket.rounds && bracket.rounds.length > 0) {
      const firstRound = bracket.rounds[0];
      // Implementation would create matches for first round
      // This is simplified - actual implementation would need table assignment, etc.
    }
  }
}

