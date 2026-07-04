import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    return this.usersRepository.findAll(pagination);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: { fullName: string; phone: string; email?: string; password: string; role?: string }) {
    const existing = await this.usersRepository.findByPhone(data.phone);
    if (existing) throw new ConflictException('Phone number already in use');
    return this.usersRepository.create(data);
  }

  async update(id: string, data: any) {
    await this.findById(id);
    return this.usersRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
