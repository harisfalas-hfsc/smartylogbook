import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Memory } from '@/lib/memories';

/** Storage a plan gets for photos, videos and documents. */
export const STORAGE_QUOTA_BYTES = { free: 1_073_741_824, premium: 21_474_836_480 };

export const formatBytes = (bytes: number) => {
  if (!bytes) return '0 MB';
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  const mb = bytes / 1_048_576;
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const isImageMemory = (m: Memory) =>
  String(m.metadata?.file_type ?? '').startsWith('image/') || ['photo', 'receipt'].includes(m.kind);

export const isVideoMemory = (m: Memory) =>
  String(m.metadata?.file_type ?? '').startsWith('video/') || m.kind === 'video';

export const isMediaMemory = (m: Memory) => !!m.attachment_url && (isImageMemory(m) || isVideoMemory(m));

export const durationOf = (m: Memory): number | null => {
  const d = m.metadata?.duration_seconds;
  return typeof d === 'number' && Number.isFinite(d) ? d : null;
};

export const formatDuration = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Album (subcategory) a record belongs to, for example "December 2025". */
export const albumOf = (m: Memory) => {
  const a = m.metadata?.album;
  return typeof a === 'string' && a.trim() ? a.trim() : null;
};

export const monthAlbum = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: 'long', year: 'numeric' });

export const albumsOf = (items: Memory[]) => {
  const map = new Map<string, number>();
  for (const m of items) {
    const a = albumOf(m);
    if (a) map.set(a, (map.get(a) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
};

const cache = new Map<string, string>();

/** Signed URL for a file stored in the private captures bucket. */
export const signedUrl = async (path: string | null | undefined) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const hit = cache.get(path);
  if (hit) return hit;
  const { data } = await supabase.storage.from('captures').createSignedUrl(path, 60 * 60);
  if (data?.signedUrl) {
    cache.set(path, data.signedUrl);
    return data.signedUrl;
  }
  return null;
};

export const useSignedUrl = (path: string | null | undefined) => {
  const [url, setUrl] = useState<string | null>(path && /^https?:\/\//.test(path) ? path : null);
  useEffect(() => {
    let active = true;
    signedUrl(path).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [path]);
  return url;
};

/** How much space the user's attachments take up. */
export const useStorageUsage = () => {
  const { user } = useAuth();
  const [used, setUsed] = useState(0);
  const [files, setFiles] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setUsed(0);
      setFiles(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('memories').select('metadata, attachment_url').not('attachment_url', 'is', null);
    let total = 0;
    let count = 0;
    for (const row of data ?? []) {
      const size = (row as { metadata?: { file_size?: unknown } }).metadata?.file_size;
      if (typeof size === 'number') total += size;
      count += 1;
    }
    setUsed(total);
    setFiles(count);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { used, files, loading, reload: load };
};
