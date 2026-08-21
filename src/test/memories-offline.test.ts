import { describe, expect, it } from 'vitest';
import { selectMemories, type Memory } from '@/lib/memories';

const record = (id: string, module: string): Memory => ({
  id,
  user_id: 'member',
  kind: 'text',
  module,
  title: id,
  summary: null,
  content: null,
  ai_tags: [],
  mood: null,
  amount: null,
  currency: null,
  location: null,
  attachment_url: null,
  metadata: {},
  related_ids: [],
  relation_note: null,
  occurred_at: '2026-08-21T10:00:00.000Z',
  created_at: '2026-08-21T10:00:00.000Z',
  updated_at: '2026-08-21T10:00:00.000Z',
});

describe('canonical offline Logbook selection', () => {
  const canonical = [record('newest', 'health'), record('middle', 'personal'), record('oldest', 'health')];

  it('applies limits locally without changing the canonical list', () => {
    expect(selectMemories(canonical, { limit: 2 }).map((item) => item.id)).toEqual(['newest', 'middle']);
    expect(canonical).toHaveLength(3);
  });

  it('applies category selection before the local limit', () => {
    expect(selectMemories(canonical, { module: 'health', limit: 1 }).map((item) => item.id)).toEqual(['newest']);
  });
});