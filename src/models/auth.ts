export type Domain = string;

export type LoginParams = {
  username: string;
  password: string;
  domain: Domain;
  lat: number;
  lng: number;
};

export type LoginResult = {
  success: boolean;
  user?: {
    studentId: string;
    name: string;
    className?: string | null;
    schoolName?: string | null;
    major?: string | null;
    avatar?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  data?: any;
  error?: string;
};