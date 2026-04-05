import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { TypesenseService, SearchResponse } from '../../../infrastructure/search/typesense.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly typesense: TypesenseService) {}

  @Get('campaigns')
  @Public()
  @ApiOperation({ summary: 'Search campaigns (public)' })
  @ApiOkResponse({ description: 'Paginated campaign search results' })
  async searchCampaigns(@Query() query: SearchQueryDto): Promise<SearchResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort = query.sort ?? 'newest';

    return this.typesense.search(
      query.q ?? '',
      {
        type: query.type,
        platform: query.platform,
        // Only surface active campaigns in search by default
        status: 'active',
      },
      sort,
      page,
      limit,
    );
  }
}
