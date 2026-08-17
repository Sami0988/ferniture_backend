import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Global search across customers, suppliers, projects, and purchases' })
  @ApiQuery({ name: 'q', type: String, description: 'Search keyword' })
  search(@Query('q') term: string) {
    return this.searchService.search(term || '');
  }
}
