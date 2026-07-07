import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeesRepository } from './employees.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly repo: EmployeesRepository) {}

  async findAll(pagination: PaginationDto, filters?: { specialty?: string; search?: string }): Promise<PaginatedResult<any>> {
    return this.repo.findAll(pagination, filters);
  }

  async findById(id: string) {
    const emp = await this.repo.findById(id);
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async create(data: any) {
    if (data.name && !data.fullName) data.fullName = data.name;
    return this.repo.create(data);
  }

  async update(id: string, userData: any, profileData: any) {
    await this.findById(id);
    return this.repo.update(id, userData, profileData);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async setActive(id: string, isActive: boolean) {
    await this.findById(id);
    return this.repo.setActive(id, isActive);
  }

  async getProjectHistory(id: string) {
    await this.findById(id);
    return this.repo.getProjectHistory(id);
  }

  async getWorkload(id: string) {
    await this.findById(id);
    return this.repo.getWorkload(id);
  }
}
