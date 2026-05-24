import firestore, { Filter } from "@react-native-firebase/firestore";
import { firebaseChatService } from "./firebaseChatService";

export type CallStatus = "ringing" | "accepted" | "ended";

export interface CallData {
  callId: string;
  callerId: string;
  calleeId: string;
  channel: string;
  conversationId?: string | null;
  status: CallStatus;
  callType: 'audio' | 'video';
  createdAt?: any;
}

/* =========================
   CREATE CALL (Caller)
========================= */
export const createCall = async (
  callId: string,
  callerId: string,
  calleeId: string,
  conversationId: string,
  callType: 'audio' | 'video'
) => {
  await firestore()
    .collection("calls")
    .doc(callId)
    .set({
      callId,
      callerId,
      calleeId,
      conversationId,
      channel: callId,
      status: "ringing",
      callType,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
};

/* =========================
   ACCEPT CALL (Callee)
========================= */
export const acceptCall = async (callId: string) => {
  await firestore()
    .collection("calls")
    .doc(callId)
    .update({
      status: "accepted",
    });
};

/* =========================
   END / DECLINE CALL
========================= */
export const endCall = async (callId: string) => {
  await firestore()
    .collection("calls")
    .doc(callId)
    .update({
      status: "ended",
    });
};

/* =========================
   LISTEN CALL STATUS
========================= */
export const listenCall = (
  callId: string,
  callback: (data: CallData | null) => void
) => {
  return firestore()
    .collection("calls")
    .doc(callId)
    .onSnapshot((doc) => {
      if (!doc.exists) {
        callback(null);
        return;
      }
      callback(doc.data() as CallData);
    });
};

/* =========================
   LISTEN INCOMING CALLS
========================= */
export const listenIncomingCall = (
  userId: string,
  onIncoming: (call: CallData) => void
) => {
  return firestore()
    .collection("calls")
    .where(
      Filter.and(
        Filter("calleeId", "==", userId),
        Filter("status", "==", "ringing")
      )
    )
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          onIncoming(change.doc.data() as CallData);
        }
      });
    });
};

export const updateDurationCall = async (
  conversationId: string,
  callId: string,
  duration: number
) => {
  if (!conversationId) {
    return false;
  }

  return firebaseChatService.updateCallDuration(conversationId, callId, duration);
};
