import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../configs/firebase";
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
  await setDoc(doc(db, "calls", callId), {
    callId,
    callerId,
    calleeId,
    conversationId,
    channel: callId,
    status: "ringing",
    callType,
    createdAt: serverTimestamp(),
  });
};

/* =========================
   ACCEPT CALL (Callee)
========================= */
export const acceptCall = async (callId: string) => {
  await updateDoc(doc(db, "calls", callId), {
    status: "accepted",
  });
};

/* =========================
   END / DECLINE CALL
========================= */
export const endCall = async (callId: string) => {
  await updateDoc(doc(db, "calls", callId), {
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
  return onSnapshot(doc(db, "calls", callId), (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    callback(docSnap.data() as CallData);
  });
};

/* =========================
   LISTEN INCOMING CALLS
========================= */
export const listenIncomingCall = (
  userId: string,
  onIncoming: (call: CallData) => void
) => {
  const q = query(
    collection(db, "calls"),
    where("calleeId", "==", userId),
    where("status", "==", "ringing")
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
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
