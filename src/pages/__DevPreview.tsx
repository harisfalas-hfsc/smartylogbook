import { useState } from 'react';
import MemoryCard from '@/components/MemoryCard';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { Memory } from '@/lib/memories';

const m: Memory = {
  id: '1', user_id: 'u', kind: 'journal', module: 'personal', title: 'Daily check-in',
  summary: 'Felt good, walked 6km.', content: 'Long details here.\nSecond line.',
  ai_tags: ['mood', 'walk'], mood: 4, amount: null, currency: null, location: 'Athens',
  attachment_url: null, metadata: {}, related_ids: [], relation_note: null,
  occurred_at: new Date().toISOString(), created_at: '', updated_at: '',
};

const DevPreview = () => {
  const [sel, setSel] = useState<Memory | null>(null);
  return (
    <div className="p-4">
      <MemoryCard memory={m} onOpen={setSel} onMove={async () => ({ error: null })} onDelete={() => {}} />
      <MemoryDetailSheet memory={sel} open={!!sel} onOpenChange={(o) => !o && setSel(null)}
        onSave={async () => ({ error: null })} onMove={async () => ({ error: null })} onDelete={() => {}} />
    </div>
  );
};
export default DevPreview;
