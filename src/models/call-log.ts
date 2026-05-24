export type CallLogType = 'audio' | 'video';

export interface CallLogModel {
  id: string;
  type: CallLogType;
  participants: string[];
  startTime: string;
  endTime?: string | null;
}