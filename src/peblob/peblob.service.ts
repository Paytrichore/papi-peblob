import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePeblobDto } from './dto/create-peblob.dto';
import { UpdatePeblobDto } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PeblobService {
  private peblobs: PeblobEntity[] = [];

  create(createPeblobDto: CreatePeblobDto): PeblobEntity {
    const newPeblob = new PeblobEntity({
      id: uuidv4(),
      ...createPeblobDto,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.peblobs.push(newPeblob);
    return newPeblob;
  }

  findAll(): PeblobEntity[] {
    return this.peblobs;
  }

  findOne(id: string): PeblobEntity {
    const peblob = this.peblobs.find(p => p.id === id);
    if (!peblob) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }
    return peblob;
  }

  update(id: string, updatePeblobDto: UpdatePeblobDto): PeblobEntity {
    const peblobIndex = this.peblobs.findIndex(p => p.id === id);
    if (peblobIndex === -1) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }

    const updatedPeblob = {
      ...this.peblobs[peblobIndex],
      ...updatePeblobDto,
      updatedAt: new Date(),
    };

    this.peblobs[peblobIndex] = updatedPeblob;
    return updatedPeblob;
  }

  remove(id: string): void {
    const peblobIndex = this.peblobs.findIndex(p => p.id === id);
    if (peblobIndex === -1) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }

    this.peblobs.splice(peblobIndex, 1);
  }

  getStats(): { total: number; active: number; inactive: number; archived: number } {
    const total = this.peblobs.length;
    const active = this.peblobs.filter(p => p.status === 'active').length;
    const inactive = this.peblobs.filter(p => p.status === 'inactive').length;
    const archived = this.peblobs.filter(p => p.status === 'archived').length;

    return { total, active, inactive, archived };
  }
}
