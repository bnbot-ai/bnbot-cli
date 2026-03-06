/**
 * Job Tools - Search and browse available jobs (boost/hire campaigns)
 */

import { z } from 'zod';

const API_BASE = 'https://api.bnbot.ai/api/v1';

const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18, WETH: 18, USDT: 6, USDC: 6,
  DAI: 18, MATIC: 18, BNB: 18, SOL: 9,
};

function formatReward(amountWei: string | null | undefined, token: string): string {
  if (!amountWei) return 'N/A';
  try {
    const decimals = TOKEN_DECIMALS[token] ?? 18;
    const amount = Number(BigInt(amountWei)) / 10 ** decimals;
    return amount >= 1 ? `${amount.toFixed(2)} ${token}` : `${amount.toFixed(6)} ${token}`;
  } catch {
    return `${amountWei} ${token}`;
  }
}

function timeRemaining(endTime: string | null | undefined): string {
  if (!endTime) return 'No deadline';
  try {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const delta = end - now;
    if (delta <= 0) return 'Expired';
    const hours = Math.floor(delta / 3600000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    const mins = Math.floor((delta % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  } catch {
    return endTime;
  }
}

export function registerJobTools(server: any) {
  server.tool(
    'search_jobs',
    'Search for available jobs — tweet engagement campaigns with crypto rewards. Returns a list of active jobs you can complete to earn rewards.',
    {
      type: z.enum(['boost', 'hire', 'all']).optional().describe('Job type: boost (engage with tweets), hire (content creation), or all (default: all)'),
      status: z.enum(['active', 'completed', 'expired']).optional().describe('Filter by status (default: active)'),
      sort: z.enum(['created_at', 'reward', 'deadline']).optional().describe('Sort field (default: created_at)'),
      limit: z.number().optional().describe('Max results (default: 10)'),
      keyword: z.string().optional().describe('Search keyword'),
      endingSoon: z.boolean().optional().describe('Only show jobs ending within 24h'),
      token: z.string().optional().describe('Filter by reward token (ETH, USDT, etc.)'),
    },
    async (params: {
      type?: 'boost' | 'hire' | 'all';
      status?: string;
      sort?: string;
      limit?: number;
      keyword?: string;
      endingSoon?: boolean;
      token?: string;
    }) => {
      const jobType = params.type || 'all';
      const status = params.status || 'active';
      const sort = params.sort || 'created_at';
      const limit = params.limit || 10;

      const searchParams = new URLSearchParams({
        status,
        sort,
        limit: String(limit),
      });
      if (params.keyword) searchParams.set('keyword', params.keyword);
      if (params.endingSoon) searchParams.set('ending_soon', 'true');
      if (params.token) searchParams.set('token', params.token);

      const endpoints: string[] = [];
      if (jobType === 'boost' || jobType === 'all') {
        endpoints.push(`${API_BASE}/boost/search?${searchParams}`);
      }
      if (jobType === 'hire' || jobType === 'all') {
        endpoints.push(`${API_BASE}/hire/search?${searchParams}`);
      }

      try {
        const results = await Promise.all(
          endpoints.map(async (url) => {
            const res = await fetch(url);
            if (!res.ok) return [];
            const json = await res.json();
            const items = json.data ?? json;
            return Array.isArray(items) ? items : [items];
          })
        );

        const allJobs = results.flat();

        if (allJobs.length === 0) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ success: true, data: { jobs: [], total: 0, message: 'No jobs found' } }, null, 2) }],
          };
        }

        const formatted = allJobs.map((job: any) => ({
          id: job.id,
          type: job.type || (job.tweetUrl ? 'boost' : 'hire'),
          tweetUrl: job.tweetUrl || job.tweet_url,
          reward: formatReward(job.rewardAmount || job.reward_amount, job.rewardToken || job.reward_token || 'ETH'),
          requirements: job.requirements || job.actions || {},
          replyGuidelines: job.replyGuidelines || job.reply_guidelines || null,
          participants: `${job.currentParticipants || job.current_participants || 0}/${job.maxParticipants || job.max_participants || '∞'}`,
          timeLeft: timeRemaining(job.endTime || job.end_time || job.deadline),
          status: job.status,
        }));

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true, data: { jobs: formatted, total: formatted.length } }, null, 2) }],
        };
      } catch (e: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: `Failed to fetch jobs: ${e.message}` }, null, 2) }],
          isError: true,
        };
      }
    }
  );
}
