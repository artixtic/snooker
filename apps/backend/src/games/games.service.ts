import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(createGameDto: CreateGameDto) {
    return this.prisma.game.create({
      data: {
        name: createGameDto.name,
        description: createGameDto.description,
        rateType: createGameDto.rateType,
        defaultRate: createGameDto.defaultRate,
        isActive: createGameDto.isActive ?? true,
      },
      include: {
        tables: {
          orderBy: {
            tableNumber: 'asc',
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.game.findMany({
      include: {
        tables: {
          orderBy: {
            tableNumber: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        tables: {
          orderBy: {
            tableNumber: 'asc',
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async update(id: string, updateGameDto: UpdateGameDto) {
    const game = await this.findOne(id);

    return this.prisma.game.update({
      where: { id },
      data: updateGameDto,
      include: {
        tables: {
          orderBy: {
            tableNumber: 'asc',
          },
        },
      },
    });
  }

  async remove(id: string) {
    const game = await this.findOne(id);

    // Check if game has any active tables
    const activeTables = await this.prisma.tableSession.findMany({
      where: {
        gameId: id,
        status: {
          in: ['OCCUPIED', 'PAUSED'],
        },
      },
    });

    if (activeTables.length > 0) {
      throw new Error(
        `Cannot delete game. There are ${activeTables.length} active table(s) associated with this game.`
      );
    }

    // Check if game has any tables at all
    const allTables = await this.prisma.tableSession.findMany({
      where: { gameId: id },
    });

    if (allTables.length > 0) {
      throw new Error(
        `Cannot delete game. There are ${allTables.length} table(s) associated with this game. Please delete or reassign the tables first.`
      );
    }

    return this.prisma.game.delete({
      where: { id },
    });
  }
}

