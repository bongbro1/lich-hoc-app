type LoginSuccess = {
  success: true;
  user: any;   // có thể thay bằng interface User
  data: any;   // có thể thay bằng type ScheduleData
};

type LoginError = {
  success: false;
  error: string;
};

export type ScheduleResult =
  | { success: true; user: any; data: any }   // có thông tin user + data
  | { success: false; error: string };

export type LoginResult = LoginSuccess | LoginError;


export interface StudentInfo_Mark {
  name: string;
  studentId: string;
  totalCredits: number;
  stcTL: number;
  tbcHS10: number;
  tbcHS4: number;
  dtbTLHS10: number;
  dtbTLHS4: number;
}

export interface Subject_Mark {
  name: string;
  code: string;
  credits: number;
  cc: number | null;
  thi: number | null;
  tkhp: number | null;
  letter: string;
  rank: string;
}
