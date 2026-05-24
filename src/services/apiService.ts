import { ScheduleResult } from "../models/viewModel";
import { getApiBaseUrl } from "../configs/config";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

export async function getSchedule({
  username,
  password,
  domain,
}: {
  username: string;
  password: string;
  domain: string;
}): Promise<ScheduleResult> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/schedule`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify({ username, password, domain }),
    });

    const result = await response.json();

    if (response.ok) {
      return result as { success: true; user: any; data: any };
    }

    return {
      success: false,
      error: result.error || "Failed to get schedule",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getStudentMarks({
  username,
  password,
  domain,
}: {
  username: string;
  password: string;
  domain: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/student_marks`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify({ username, password, domain }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error || "Failed to get student marks",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
