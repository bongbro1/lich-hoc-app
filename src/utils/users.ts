
export const formatLastSeen = (lastSeen?: string | null) => {
  if (!lastSeen) return 'Không hoạt động';

  const last = new Date(lastSeen).getTime();
  const now = Date.now();
  const diffMs = now - last;

  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa hoạt động';
  if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;
  if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;
  return `Hoạt động ${diffDays} ngày trước`;
};