import { AgoraTokenResponse } from "../types/typesChat";
import { getApiBaseUrl } from "../configs/config";

export const fetchAgoraToken = async (
  channel: string,
  uid: number
): Promise<AgoraTokenResponse | null> => {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/agora/token?channel=${channel}&uid=${uid}`
    );

    if (!res.ok) {
      throw new Error(`fetchAgoraToken error: ${res.status}`);
    }

    const data: AgoraTokenResponse = await res.json();
    return data;
  } catch (err) {
    console.error("fetchAgoraToken error:", err);
    return null;
  }
};