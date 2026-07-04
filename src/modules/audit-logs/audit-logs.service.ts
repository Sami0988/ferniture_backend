import { Injectable } from '@nestjs/common';
import { AuditLogsRepository } from './audit-logs.repository';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository) {}

  async findAll(pagination: PaginationDto, filters?: { entityType?: string; userId?: string }) {
    return this.repo.findAll(pagination, filters);
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.repo.findByEntity(entityType, entityId);
  }
}
