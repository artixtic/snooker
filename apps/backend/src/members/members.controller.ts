import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.membersService.findAll(
      search,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Get(':id/balance')
  getCreditBalance(@Param('id') id: string) {
    return this.membersService.getCreditBalance(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}

