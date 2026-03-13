import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  Firestore,
} from "firebase/firestore";
import type { Session, SessionSnapshot } from "@/types/session";

type Unsubscribe = () => void;

const ROOM_ID = "main";

function sessionDoc(db: Firestore, storeId: string, dateId: string) {
  return doc(db, `stores/${storeId}/rooms/${ROOM_ID}/sessions/${dateId}`);
}

function todayDateId(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function snapToSession(snap: { id: string; data: () => Record<string, unknown> }): SessionSnapshot {
  const data = snap.data();
  return {
    id: snap.id,
    date: data.date as string,
    status: data.status as SessionSnapshot["status"],
    openedAt: data.openedAt as SessionSnapshot["openedAt"],
    openedBy: data.openedBy as string,
    closedAt: (data.closedAt as SessionSnapshot["closedAt"]) ?? null,
    closedBy: (data.closedBy as string) ?? null,
  };
}

/** Abre (ou reabre) a sessão do dia atual para a sala. */
export const openSession = async (
  db: Firestore,
  storeId: string,
  openedByUid: string
): Promise<void> => {
  const dateId = todayDateId();
  const payload: Session = {
    date: dateId,
    status: "open",
    openedAt: serverTimestamp(),
    openedBy: openedByUid,
    closedAt: null,
    closedBy: null,
  };
  await setDoc(sessionDoc(db, storeId, dateId), payload);
};

/** Fecha a sessão identificada por dateId. */
export const closeSession = async (
  db: Firestore,
  storeId: string,
  dateId: string,
  closedByUid: string
): Promise<void> => {
  await updateDoc(sessionDoc(db, storeId, dateId), {
    status: "closed",
    closedAt: serverTimestamp(),
    closedBy: closedByUid,
  });
};

/** Leitura pontual: retorna a sessão aberta de hoje, ou null. */
export const getActiveSession = async (
  db: Firestore,
  storeId: string | undefined
): Promise<SessionSnapshot | null> => {
  if (!storeId) return null;
  const snap = await getDoc(sessionDoc(db, storeId, todayDateId()));
  if (!snap.exists() || snap.data().status !== "open") return null;
  return snapToSession(snap as Parameters<typeof snapToSession>[0]);
};

/** Subscription em tempo real: emite a sessão aberta de hoje, ou null. */
export const subscribeToActiveSession = (
  db: Firestore,
  storeId: string | undefined,
  listener: (session: SessionSnapshot | null) => void
): Unsubscribe | void => {
  if (!storeId) return;

  return onSnapshot(sessionDoc(db, storeId, todayDateId()), (snap) => {
    if (!snap.exists() || snap.data().status !== "open") {
      listener(null);
      return;
    }
    listener(snapToSession(snap as Parameters<typeof snapToSession>[0]));
  });
};
