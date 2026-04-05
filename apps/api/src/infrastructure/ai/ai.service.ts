import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../persistence/prisma.service';

export interface MatchedClipper {
  userId: string;
  name: string;
  avatarUrl: string | null;
  nicheTags: string[];
  clipperScore: number;
  clipperTier: string;
  matchScore: number;
  matchReasons: string[];
}

export interface GeneratedBrief {
  title: string;
  description: string;
  guidelines: string;
}

const TIER_WEIGHTS: Record<string, number> = {
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Match top 10 clippers for a campaign (or ad-hoc niche/platform criteria).
   * Uses heuristic scoring — no LLM required.
   */
  async matchClippers(params: {
    campaignId?: string;
    niche?: string[];
    platforms?: string[];
  }): Promise<MatchedClipper[]> {
    let campaignNiches: string[] = params.niche ?? [];
    let campaignPlatforms: string[] = params.platforms ?? [];

    if (params.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: params.campaignId },
        select: { targetPlatforms: true, description: true, title: true },
      });
      if (!campaign) throw new NotFoundException('Campaign not found');
      campaignPlatforms = campaign.targetPlatforms;
      // Derive niche tags from campaign description (simple keyword extraction)
      campaignNiches = params.niche ?? [];
    }

    // Fetch active clippers with relevant data
    const clippers = await this.prisma.user.findMany({
      where: { role: 'clipper' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        nicheTags: true,
        clipperScore: true,
        clipperTier: true,
        clips: {
          where: { status: { in: ['submitted', 'under_review'] } },
          select: { id: true },
        },
      },
      take: 200,
    });

    const scored: MatchedClipper[] = clippers.map((clipper) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Niche overlap
      if (campaignNiches.length > 0) {
        const overlap = clipper.nicheTags.filter((tag) =>
          campaignNiches.some(
            (cn) => cn.toLowerCase() === tag.toLowerCase(),
          ),
        ).length;
        if (overlap > 0) {
          const nichemScore = Math.min(overlap * 20, 40);
          score += nichemScore;
          reasons.push(`${overlap} niche tag(s) match`);
        }
      } else {
        // No niche filter — mild bonus for having any tags
        if (clipper.nicheTags.length > 0) {
          score += 5;
          reasons.push('has niche tags');
        }
      }

      // 2. Clipper tier
      const tierScore = (TIER_WEIGHTS[clipper.clipperTier] ?? 1) * 10;
      score += tierScore;
      reasons.push(`tier: ${clipper.clipperTier}`);

      // 3. Clipper score (normalize to 0-30 range, assuming max ~1000)
      const normalizedScore = Math.min(Math.floor((clipper.clipperScore / 1000) * 30), 30);
      score += normalizedScore;
      if (clipper.clipperScore > 0) {
        reasons.push(`score: ${clipper.clipperScore}`);
      }

      // 4. Availability penalty — too many in-flight clips
      const activeCampaigns = clipper.clips.length;
      if (activeCampaigns >= 5) {
        score -= 15;
        reasons.push(`busy: ${activeCampaigns} active clips`);
      } else if (activeCampaigns >= 3) {
        score -= 5;
      }

      return {
        userId: clipper.id,
        name: clipper.name,
        avatarUrl: clipper.avatarUrl,
        nicheTags: clipper.nicheTags,
        clipperScore: clipper.clipperScore,
        clipperTier: clipper.clipperTier,
        matchScore: Math.max(score, 0),
        matchReasons: reasons,
      };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  /**
   * Generate a campaign brief for a given topic/type/platforms.
   * Falls back to template when no LLM API key is configured.
   */
  async generateBrief(params: {
    topic: string;
    type: string;
    targetPlatforms: string[];
  }): Promise<GeneratedBrief> {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey) {
      try {
        return await this.callOpenAI(params, openaiKey);
      } catch (err) {
        this.logger.warn(`OpenAI call failed, falling back to template: ${(err as Error).message}`);
      }
    } else if (anthropicKey) {
      try {
        return await this.callAnthropic(params, anthropicKey);
      } catch (err) {
        this.logger.warn(`Anthropic call failed, falling back to template: ${(err as Error).message}`);
      }
    }

    return this.generateTemplateBrief(params);
  }

  private async callOpenAI(
    params: { topic: string; type: string; targetPlatforms: string[] },
    apiKey: string,
  ): Promise<GeneratedBrief> {
    const prompt = this.buildBriefPrompt(params);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a content marketing expert. Generate campaign briefs in JSON with keys: title, description, guidelines.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    return JSON.parse(data.choices[0].message.content) as GeneratedBrief;
  }

  private async callAnthropic(
    params: { topic: string; type: string; targetPlatforms: string[] },
    apiKey: string,
  ): Promise<GeneratedBrief> {
    const prompt = this.buildBriefPrompt(params);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-20240307',
        max_tokens: 800,
        system:
          'You are a content marketing expert. Generate campaign briefs in JSON with keys: title, description, guidelines.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: { text: string }[];
    };
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Anthropic response');
    return JSON.parse(jsonMatch[0]) as GeneratedBrief;
  }

  private buildBriefPrompt(params: {
    topic: string;
    type: string;
    targetPlatforms: string[];
  }): string {
    return (
      `Create a campaign brief for a ${params.type} campaign about "${params.topic}" ` +
      `targeting ${params.targetPlatforms.join(', ') || 'social media'} platforms. ` +
      `Return JSON with: title (campaign name), description (2-3 sentences), guidelines (bullet list of do/don'ts).`
    );
  }

  private generateTemplateBrief(params: {
    topic: string;
    type: string;
    targetPlatforms: string[];
  }): GeneratedBrief {
    const platforms = params.targetPlatforms.join(', ') || 'social media platforms';
    const typeLabel =
      params.type === 'bounty'
        ? 'Bounty'
        : params.type === 'gig'
          ? 'Gig'
          : 'Podcast';

    return {
      title: `${params.topic} — ${typeLabel} Campaign`,
      description:
        `We are looking for talented content creators to produce engaging clips about "${params.topic}" ` +
        `for ${platforms}. This is a ${params.type} campaign rewarding high-quality, original content ` +
        `that resonates with our target audience.`,
      guidelines: [
        `- Content must be original and directly related to the topic: "${params.topic}"`,
        `- Target platform(s): ${platforms}`,
        `- Keep videos between 30–90 seconds for maximum engagement`,
        `- Use clear, high-quality audio and visuals`,
        `- Include a clear call-to-action`,
        `- Do NOT use copyrighted music without a license`,
        `- Do NOT include misleading or false claims`,
        `- Submit only content you own the rights to`,
        `- Hashtags and captions must be accurate and relevant`,
      ].join('\n'),
    };
  }
}
