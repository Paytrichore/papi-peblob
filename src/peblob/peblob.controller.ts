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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
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
  @ApiOperation({
    summary: 'Créer un nouveau peblob avec une structure carrée de ptiblobs',
  })
  @ApiBody({ type: CreatePeblobDto })
  @ApiResponse({
    status: 201,
    description: 'Le peblob a été créé avec succès',
    type: PeblobEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Structure invalide (doit être carrée)',
  })
  create(@Body() createPeblobDto: CreatePeblobDto): PeblobEntity {
    return this.peblobService.create(createPeblobDto);
  }

  @Post('random')
  @ApiOperation({
    summary: 'Créer un peblob aléatoire avec une taille spécifiée',
  })
  @ApiQuery({
    name: 'name',
    description: 'Nom du peblob',
    example: 'Peblob Aléatoire',
  })
  @ApiQuery({
    name: 'size',
    description: 'Taille du carré (1-50)',
    example: 3,
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Le peblob aléatoire a été créé avec succès',
    type: PeblobEntity,
  })
  createRandom(
    @Query('name') name: string,
    @Query('size', new ParseIntPipe({ optional: true })) size?: number,
  ): PeblobEntity {
    return this.peblobService.createRandom(name, size);
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

  @Get('size/:size')
  @ApiOperation({ summary: 'Récupérer les peblobs par taille' })
  @ApiParam({ name: 'size', description: 'Taille du carré', example: 3 })
  @ApiResponse({
    status: 200,
    description: 'Liste des peblobs de la taille spécifiée',
    type: [PeblobEntity],
  })
  findBySize(@Param('size', ParseIntPipe) size: number): PeblobEntity[] {
    return this.peblobService.findBySize(size);
  }

  @Get('brightness')
  @ApiOperation({ summary: 'Récupérer les peblobs par luminosité' })
  @ApiQuery({
    name: 'min',
    description: 'Luminosité minimale (0-255)',
    example: 0,
    required: false,
  })
  @ApiQuery({
    name: 'max',
    description: 'Luminosité maximale (0-255)',
    example: 255,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des peblobs dans la plage de luminosité',
    type: [PeblobEntity],
  })
  findByBrightness(
    @Query('min', new ParseIntPipe({ optional: true })) min?: number,
    @Query('max', new ParseIntPipe({ optional: true })) max?: number,
  ): PeblobEntity[] {
    return this.peblobService.findByBrightness(min, max);
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

  @Get(':id/dominant-color')
  @ApiOperation({ summary: "Récupérer la couleur dominante d'un peblob" })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiResponse({
    status: 200,
    description: 'Couleur dominante du peblob',
    schema: {
      type: 'object',
      properties: {
        r: { type: 'number', example: 128 },
        g: { type: 'number', example: 64 },
        b: { type: 'number', example: 32 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  getDominantColor(@Param('id') id: string): {
    r: number;
    g: number;
    b: number;
  } {
    return this.peblobService.getDominantColor(id);
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
  @ApiResponse({ status: 400, description: 'Structure invalide' })
  update(
    @Param('id') id: string,
    @Body() updatePeblobDto: UpdatePeblobDto,
  ): PeblobEntity {
    return this.peblobService.update(id, updatePeblobDto);
  }

  @Patch(':id/ptiblob/:row/:col')
  @ApiOperation({
    summary: 'Mettre à jour un ptiblob spécifique dans un peblob',
  })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiParam({ name: 'row', description: 'Ligne du ptiblob (commence à 0)' })
  @ApiParam({ name: 'col', description: 'Colonne du ptiblob (commence à 0)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        r: { type: 'number', minimum: 0, maximum: 255, example: 255 },
        g: { type: 'number', minimum: 0, maximum: 255, example: 128 },
        b: { type: 'number', minimum: 0, maximum: 255, example: 64 },
      },
      required: ['r', 'g', 'b'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Le ptiblob a été mis à jour avec succès',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  @ApiResponse({ status: 400, description: 'Position invalide' })
  updatePtiblob(
    @Param('id') id: string,
    @Param('row', ParseIntPipe) row: number,
    @Param('col', ParseIntPipe) col: number,
    @Body() ptiblob: { r: number; g: number; b: number },
  ): PeblobEntity {
    return this.peblobService.updatePtiblob(
      id,
      row,
      col,
      ptiblob.r,
      ptiblob.g,
      ptiblob.b,
    );
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

  // 👥 ENDPOINTS POUR LA GESTION DES UTILISATEURS

  @Get('user/:userId')
  @ApiOperation({ summary: "Récupérer tous les peblobs d'un utilisateur" })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Liste des peblobs de l'utilisateur",
    type: [PeblobEntity],
  })
  findByUserId(@Param('userId') userId: string): PeblobEntity[] {
    return this.peblobService.findByUserId(userId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: "Récupérer les statistiques d'un utilisateur" })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Statistiques de l'utilisateur",
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 10 },
        active: { type: 'number', example: 8 },
        inactive: { type: 'number', example: 1 },
        archived: { type: 'number', example: 1 },
        averageSize: { type: 'number', example: 12 },
        totalPixels: { type: 'number', example: 150 },
      },
    },
  })
  getUserStats(@Param('userId') userId: string) {
    return this.peblobService.getUserStats(userId);
  }

  @Patch(':id/transfer/:newUserId')
  @ApiOperation({ summary: 'Transférer un peblob à un autre utilisateur' })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiParam({ name: 'newUserId', description: 'ID du nouvel utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Peblob transféré avec succès',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  transferPeblobToUser(
    @Param('id') id: string,
    @Param('newUserId') newUserId: string,
  ): PeblobEntity {
    return this.peblobService.transferPeblobToUser(id, newUserId);
  }

  @Get('public')
  @ApiOperation({
    summary: 'Récupérer les peblobs publics (sans propriétaire)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des peblobs publics',
    type: [PeblobEntity],
  })
  findPublicPeblobs(): PeblobEntity[] {
    return this.peblobService.findPublicPeblobs();
  }

  @Delete('user/:userId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Supprimer tous les peblobs d'un utilisateur",
    description:
      'Utile pour la conformité GDPR - supprime tous les peblobs associés à un utilisateur',
  })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: 'Nombre de peblobs supprimés',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number', example: 5 },
      },
    },
  })
  removeAllByUserId(@Param('userId') userId: string): { deletedCount: number } {
    const deletedCount = this.peblobService.removeAllByUserId(userId);
    return { deletedCount };
  }
}
