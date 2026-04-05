import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { TypesenseService } from '../../../infrastructure/search/typesense.service';
import { SearchQueryDto, SearchSortEnum, SearchTypeEnum } from './dto/search-query.dto';

const mockTypesense = {
  search: jest.fn(),
};

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: TypesenseService, useValue: mockTypesense }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchCampaigns', () => {
    it('should return results with empty query (wildcard search)', async () => {
      const mockResponse = {
        hits: [
          {
            id: 'campaign-1',
            title: 'Gaming Campaign',
            description: 'A gaming campaign',
            type: 'bounty',
            status: 'active',
            targetPlatforms: ['tiktok'],
            ratePerKViews: 5000,
            budgetTotal: 500000,
            budgetRemaining: 500000,
            ownerName: 'Owner',
            clipCount: 0,
            createdAt: 1700000000,
          },
        ],
        found: 1,
        page: 1,
      };

      mockTypesense.search.mockResolvedValue(mockResponse);

      const query: SearchQueryDto = {};
      const result = await controller.searchCampaigns(query);

      expect(result.found).toBe(1);
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0].title).toBe('Gaming Campaign');
      expect(mockTypesense.search).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ status: 'active' }),
        'newest',
        1,
        20,
      );
    });

    it('should pass query string and type filter to typesense', async () => {
      mockTypesense.search.mockResolvedValue({ hits: [], found: 0, page: 1 });

      const query: SearchQueryDto = {
        q: 'gaming',
        type: SearchTypeEnum.bounty,
        platform: 'tiktok',
        sort: SearchSortEnum.rate,
        page: 2,
        limit: 10,
      };

      await controller.searchCampaigns(query);

      expect(mockTypesense.search).toHaveBeenCalledWith(
        'gaming',
        { type: 'bounty', platform: 'tiktok', status: 'active' },
        'rate',
        2,
        10,
      );
    });

    it('should return empty results when typesense is unavailable', async () => {
      mockTypesense.search.mockResolvedValue({ hits: [], found: 0, page: 1 });

      const query: SearchQueryDto = { q: 'test' };
      const result = await controller.searchCampaigns(query);

      expect(result.hits).toHaveLength(0);
      expect(result.found).toBe(0);
    });

    it('should use default sort=newest when not specified', async () => {
      mockTypesense.search.mockResolvedValue({ hits: [], found: 0, page: 1 });

      const query: SearchQueryDto = { q: 'campaign' };
      await controller.searchCampaigns(query);

      expect(mockTypesense.search).toHaveBeenCalledWith(
        'campaign',
        expect.any(Object),
        'newest',
        1,
        20,
      );
    });
  });
});
