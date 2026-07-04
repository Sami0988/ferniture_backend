import { Module } from '@nestjs/common';
import { MaterialsController, ProjectMaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialsRepository } from './materials.repository';

@Module({
  controllers: [MaterialsController, ProjectMaterialsController],
  providers: [MaterialsService, MaterialsRepository],
  exports: [MaterialsService],
})
export class MaterialsModule {}
