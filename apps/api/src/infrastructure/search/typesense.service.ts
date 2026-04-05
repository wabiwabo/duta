import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as TypesenseClient } from 'typesense';

export interface CampaignSearchResult {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  targetPlatforms: string[];
  ratePerKViews?: number;
  budgetTotal: number;
  budgetRemaining: number;
  ownerName: string;
  clipCount: number;
  createdAt: number;
}

export interface SearchResponse {
  hits: CampaignSearchResult[];
  found: number;
  page: number;
}

const CAMPAIGNS_COLLECTION = 'campaigns';

const campaignSchema = {
  name: CAMPAIGNS_COLLECTION,
  fields: [
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const },
    { name: 'type', type: 'string' as const, facet: true },
    { name: 'status', type: 'string' as const, facet: true },
    { name: 'targetPlatforms', type: 'string[]' as const, facet: true },
    { name: 'ratePerKViews', type: 'int32' as const, optional: true },
    { name: 'budgetTotal', type: 'int32' as const },
    { name: 'budgetRemaining', type: 'int32' as const },
    { name: 'ownerName', type: 'string' as const },
    { name: 'clipCount', type: 'int32' as const },
    { name: 'createdAt', type: 'int64' as const },
  ],
  default_sorting_field: 'createdAt',
};

@Injectable()
export class TypesenseService implements OnModuleInit {
  private readonly logger = new Logger(TypesenseService.name);
  private client: TypesenseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.client = new TypesenseClient({
        nodes: [
          {
            host: this.config.get<string>('TYPESENSE_HOST', 'localhost'),
            port: this.config.get<number>('TYPESENSE_PORT', 8108),
            protocol: 'http',
          },
        ],
        apiKey: this.config.get<string>('TYPESENSE_API_KEY', 'duta_typesense_key'),
        connectionTimeoutSeconds: 2,
      });

      await this.initCollection();
    } catch (err) {
      this.logger.warn(`Typesense initialization failed — search will be unavailable: ${(err as Error).message}`);
      this.client = null;
    }
  }

  private async initCollection(): Promise<void> {
    if (!this.client) return;
    try {
      // Check if collection exists
      await this.client.collections(CAMPAIGNS_COLLECTION).retrieve();
      // Collection exists — update schema fields if needed (no-op for now)
      this.logger.log('Typesense campaigns collection already exists');
    } catch {
      // Collection does not exist, create it
      try {
        await this.client.collections().create(campaignSchema);
        this.logger.log('Typesense campaigns collection created');
      } catch (createErr) {
        this.logger.warn(`Failed to create Typesense collection: ${(createErr as Error).message}`);
        throw createErr;
      }
    }
  }

  async indexCampaign(campaign: {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    targetPlatforms: string[];
    ratePerKViews: number | null;
    budgetTotal: number;
    budgetRemaining: number;
    ownerName: string;
    clipCount: number;
    createdAt: Date;
  }): Promise<void> {
    if (!this.client) return;
    try {
      const doc = {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        targetPlatforms: campaign.targetPlatforms,
        ...(campaign.ratePerKViews != null ? { ratePerKViews: campaign.ratePerKViews } : {}),
        budgetTotal: campaign.budgetTotal,
        budgetRemaining: campaign.budgetRemaining,
        ownerName: campaign.ownerName,
        clipCount: campaign.clipCount,
        createdAt: Math.floor(campaign.createdAt.getTime() / 1000),
      };
      await this.client.collections(CAMPAIGNS_COLLECTION).documents().upsert(doc);
    } catch (err) {
      this.logger.warn(`Failed to index campaign ${campaign.id}: ${(err as Error).message}`);
    }
  }

  async removeCampaign(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.collections(CAMPAIGNS_COLLECTION).documents(id).delete();
    } catch (err) {
      this.logger.warn(`Failed to remove campaign ${id} from index: ${(err as Error).message}`);
    }
  }

  async search(
    query: string,
    filters: { type?: string; status?: string; platform?: string },
    sortBy: 'newest' | 'rate' | 'budget',
    page: number,
    perPage: number,
  ): Promise<SearchResponse> {
    if (!this.client) {
      return { hits: [], found: 0, page };
    }

    try {
      const filterParts: string[] = [];
      if (filters.type) filterParts.push(`type:=${filters.type}`);
      if (filters.status) filterParts.push(`status:=${filters.status}`);
      if (filters.platform) filterParts.push(`targetPlatforms:=${filters.platform}`);

      const sortMap: Record<string, string> = {
        newest: 'createdAt:desc',
        rate: 'ratePerKViews:desc',
        budget: 'budgetRemaining:desc',
      };

      const searchParams: Record<string, string | number> = {
        q: query || '*',
        query_by: 'title,description',
        sort_by: sortMap[sortBy] ?? 'createdAt:desc',
        page,
        per_page: perPage,
      };

      if (filterParts.length > 0) {
        searchParams['filter_by'] = filterParts.join(' && ');
      }

      const result = await this.client.collections(CAMPAIGNS_COLLECTION).documents().search(searchParams);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hits: CampaignSearchResult[] = (result.hits ?? []).map((hit: any) => {
        const doc = hit.document as Record<string, unknown>;
        return {
          id: doc['id'] as string,
          title: doc['title'] as string,
          description: doc['description'] as string,
          type: doc['type'] as string,
          status: doc['status'] as string,
          targetPlatforms: doc['targetPlatforms'] as string[],
          ratePerKViews: doc['ratePerKViews'] as number | undefined,
          budgetTotal: doc['budgetTotal'] as number,
          budgetRemaining: doc['budgetRemaining'] as number,
          ownerName: doc['ownerName'] as string,
          clipCount: doc['clipCount'] as number,
          createdAt: doc['createdAt'] as number,
        };
      });

      return {
        hits,
        found: result.found ?? 0,
        page: result.page ?? page,
      };
    } catch (err) {
      this.logger.warn(`Typesense search failed: ${(err as Error).message}`);
      return { hits: [], found: 0, page };
    }
  }
}
