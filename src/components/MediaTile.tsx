import { Play } from 'lucide-react';
import { Memory, titleOf } from '@/lib/memories';
import { durationOf, formatDuration, isVideoMemory, useSignedUrl } from '@/lib/media';
import { kindIcon } from '@/lib/constants';

interface Props {
  memory: Memory;
  /** Optional specific file of the record, so a record with 3 photos shows 3 tiles. */
  file?: { path: string; name?: string; type?: string };
  onOpen?: (memory: Memory) => void;
}

/** Square tile used by the grid view of a category. */
const MediaTile = ({ memory, file, onOpen }: Props) => {
  const url = useSignedUrl(file ? file.path : memory.attachment_url);
  const video = file?.type ? file.type.startsWith('video/') : isVideoMemory(memory);
  const seconds = durationOf(memory);
  const Icon = kindIcon(memory.kind);
  const label = file?.name ?? titleOf(memory);

  return (
    <button
      onClick={() => onOpen?.(memory)}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary text-left transition-smooth active:scale-[0.98]"
    >
      {url && !video ? (
        <img src={url} alt={label} loading="lazy" className="h-full w-full object-cover" />
      ) : url && video ? (
        <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 text-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="line-clamp-2 text-[10px] font-semibold text-muted-foreground">{label}</span>
        </span>
      )}
      {video && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-foreground/70 px-1.5 py-0.5 text-[10px] font-bold text-background">
          <Play className="h-2.5 w-2.5" />
          {seconds != null ? formatDuration(seconds) : 'Video'}
        </span>
      )}
    </button>
  );
};

export default MediaTile;
