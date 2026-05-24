import { getApiBaseUrl } from 'configs/config';
import { LoginParams, LoginResult } from '../models/auth';

class AuthRepository {
  async login(params: LoginParams) {
    const res = await fetch(`${getApiBaseUrl()}/app-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    return {
      success: Boolean(data?.success),
      user: data?.user,
      data: data?.data,
      error: data?.error || data?.message,
    };
  }
}

export const authRepository = new AuthRepository();
