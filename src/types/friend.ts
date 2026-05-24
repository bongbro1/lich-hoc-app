export type Friend = {
  studentId: string;
  name: string;
  major?: string | null;
  className?: string | null;
  avatar?: string | null;
  online?: boolean;
  onlineStatus?: string;
  mutualCount: number;
};
