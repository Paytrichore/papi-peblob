import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PeblobService } from './peblob.service';
import { CreatePeblobDto } from './dto/create-peblob.dto';
import { UpdatePeblobDto } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';

@ApiTags('peblobs')
@Controller('peblobs')
export class PeblobController {
  constructor(private readonly peblobService: PeblobService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau peblob' })
  @ApiBody({ type: CreatePeblobDto })
  @ApiResponse({
    status: 201,
    description: 'Le peblob a été créé avec succès',
    type: PeblobEntity,
  })
  create(@Body() createPeblobDto: CreatePeblobDto): PeblobEntity {
    return this.peblobService.create(createPeblobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les peblobs' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les peblobs',
    type: [PeblobEntity],
  })
  findAll(): PeblobEntity[] {
    return this.peblobService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Récupérer les statistiques des peblobs' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des peblobs',
  })
  getStats() {
    return this.peblobService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un peblob par son ID' })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiResponse({
    status: 200,
    description: 'Le peblob trouvé',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  findOne(@Param('id') id: string): PeblobEntity {
    return this.peblobService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un peblob' })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiBody({ type: UpdatePeblobDto })
  @ApiResponse({
    status: 200,
    description: 'Le peblob a été mis à jour avec succès',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  update(
    @Param('id') id: string,
    @Body() updatePeblobDto: UpdatePeblobDto,
  ): PeblobEntity {
    return this.peblobService.update(id, updatePeblobDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un peblob' })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiResponse({ status: 204, description: 'Peblob supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  remove(@Param('id') id: string): void {
    return this.peblobService.remove(id);
  }
}
