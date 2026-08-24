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
  Headers,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';
import { PeblobService } from './peblob.service';
import { UpdatePeblobDto } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';
import { CreatePeblobForUserDto } from './dto/create-peblob-for-user.dto';
import { PtiblobDto } from './dto/create-ptiblob.dto';
import { FindPeblobsByIdsDto } from './dto/find-peblobs-by-ids.dto';
import { Peblob } from './schemas/peblob.schema';
import {
  PlacementCompensationEventDto,
  PlacementEventDto,
} from './dto/placement-event.dto';
import { WebhookSignatureService } from './webhook-signature.service';
import { FindUserPeblobsQueryDto } from './dto/find-user-peblobs-query.dto';
import { PeblobPageResponseDto } from './dto/peblob-page-response.dto';
import { PeblobDominantColor } from './dto/create-peblob.dto';
import { ApplyStoryDto } from './dto/apply-story.dto';
import { PurchasePowerDto } from './dto/purchase-power.dto';

interface RawBodyRequest extends Request {
  rawBody?: string;
}

@ApiTags('peblob')
@ApiExtraModels(PtiblobDto)
@Controller('peblob')
export class PeblobController {
  constructor(
    private readonly peblobService: PeblobService,
    private readonly signatureService: WebhookSignatureService,
  ) {}

  @Post('webhooks/placement')
  async handlePlacement(
    @Body() event: PlacementEventDto,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Headers('x-webhook-timestamp') timestamp: string | undefined,
    @Req() request: RawBodyRequest,
  ) {
    this.signatureService.assertValidSignature(
      signature,
      timestamp,
      request.rawBody ?? JSON.stringify(event),
    );
    return this.peblobService.markPlacedFromEvent(event);
  }

  @Post('webhooks/placement/compensate')
  async compensatePlacement(
    @Body() event: PlacementCompensationEventDto,
    @Headers('x-webhook-signature') signature: string | undefined,
    @Headers('x-webhook-timestamp') timestamp: string | undefined,
    @Req() request: RawBodyRequest,
  ) {
    this.signatureService.assertValidSignature(
      signature,
      timestamp,
      request.rawBody ?? JSON.stringify(event),
    );
    return this.peblobService.compensatePlacement(event);
  }

  @Post()
  @ApiOperation({
    summary:
      'Créer un peblob pour un utilisateur donné avec une structure carrée de ptiblobs',
  })
  @ApiBody({ type: CreatePeblobForUserDto })
  @ApiResponse({ status: 201, description: 'Peblob créé', type: PeblobEntity })
  async create(
    @Body() createPeblobForUserDto: CreatePeblobForUserDto,
  ): Promise<Peblob> {
    return this.peblobService.create(createPeblobForUserDto);
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
  async createRandom(
    @Query('name') name: string,
    @Query('size', new ParseIntPipe({ optional: true })) size?: number,
  ) {
    return this.peblobService.createRandom(name, size);
  }

  @Post('by-ids')
  @ApiOperation({ summary: 'Récupérer plusieurs peblobs par leurs IDs' })
  @ApiBody({ type: FindPeblobsByIdsDto })
  @ApiResponse({
    status: 200,
    description: 'Liste des peblobs trouvés',
    type: [PeblobEntity],
  })
  findByIds(
    @Body() findPeblobsByIdsDto: FindPeblobsByIdsDto,
  ): Promise<Array<Peblob & { ownerName?: string }>> {
    return this.peblobService.findByIds(findPeblobsByIdsDto.ids);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les peblobs' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les peblobs',
    type: [PeblobEntity],
  })
  findAll() {
    return this.peblobService.findAll();
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

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un peblob par son ID' })
  @ApiParam({ name: 'id', description: 'ID du peblob' })
  @ApiResponse({
    status: 200,
    description: 'Le peblob trouvé',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 404, description: 'Peblob non trouvé' })
  findOne(@Param('id') id: string) {
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
  @ApiResponse({ status: 400, description: 'Structure invalide' })
  async update(
    @Param('id') id: string,
    @Body() updatePeblobDto: UpdatePeblobDto,
  ) {
    return this.peblobService.update(id, updatePeblobDto);
  }

  @Post(':id/stories')
  @ApiOperation({ summary: 'Appliquer une story à un Peblob et débiter 1 PA' })
  @ApiParam({ name: 'id', description: 'ID du Peblob' })
  @ApiBody({ type: ApplyStoryDto })
  @ApiResponse({
    status: 200,
    description: 'Story appliquée',
    type: PeblobEntity,
  })
  @ApiResponse({ status: 409, description: 'Story déjà jouée' })
  @ApiResponse({ status: 402, description: 'PA insuffisants' })
  applyStory(@Param('id') id: string, @Body() dto: ApplyStoryDto) {
    return this.peblobService.applyStory(id, dto);
  }

  @Post(':id/powers')
  @ApiOperation({ summary: 'Acheter un pouvoir avec un point disponible' })
  @ApiParam({ name: 'id', description: 'ID du Peblob' })
  @ApiBody({ type: PurchasePowerDto })
  @ApiResponse({
    status: 200,
    description: 'Pouvoir acheté',
    type: PeblobEntity,
  })
  @ApiResponse({
    status: 409,
    description: 'Pouvoir déjà acheté ou points insuffisants',
  })
  purchasePower(@Param('id') id: string, @Body() dto: PurchasePowerDto) {
    return this.peblobService.purchasePower(id, dto.powerId);
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
  async remove(@Param('id') id: string) {
    return this.peblobService.remove(id);
  }

  // 👥 ENDPOINTS POUR LA GESTION DES UTILISATEURS

  @Get('user/:userId')
  @ApiOperation({ summary: "Récupérer tous les peblobs d'un utilisateur" })
  @ApiParam({ name: 'userId', description: "ID de l'utilisateur" })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    minimum: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @ApiQuery({
    name: 'color',
    required: false,
    enum: Object.values(PeblobDominantColor),
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['AVAILABLE', 'ON_MAP'],
  })
  @ApiResponse({
    status: 200,
    description: "Page des peblobs de l'utilisateur",
    type: PeblobPageResponseDto,
  })
  async findByUserId(
    @Param('userId') userId: string,
    @Query() query: FindUserPeblobsQueryDto,
  ) {
    return this.peblobService.findByUserIdPaginated(userId, query);
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
