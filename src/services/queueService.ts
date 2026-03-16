import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  QuerySnapshot,
  DocumentData,
  Firestore,
} from "firebase/firestore";
import type { QueueItem } from "@/types/queue";
import { ROOM_ID } from "@/constants";

type Unsubscribe = () => void;

function queueCol(db: Firestore, storeId: string) {
  return collection(db, `stores/${storeId}/rooms/${ROOM_ID}/queue`);
}

function stageDoc(db: Firestore, storeId: string) {
  return doc(db, `stores/${storeId}/rooms/${ROOM_ID}/stage/current`);
}

export const subscribeToQueue = (
  db: Firestore,
  storeId: string | undefined,
  listener: (items: QueueItem[]) => void
): Unsubscribe | void => {
  if (!storeId) return;

  const q = query(
    queueCol(db, storeId),
    where("alreadySang", "==", false),
    orderBy("addedAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const list: QueueItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as QueueItem),
    }));
    listener(list);
  });
};

export const subscribeToOnStageSinger = (
  db: Firestore,
  storeId: string | undefined,
  listener: (singer: QueueItem | null) => void
): Unsubscribe | void => {
  if (!storeId) return;

  return onSnapshot(stageDoc(db, storeId), (snap) => {
    if (!snap.exists()) {
      listener(null);
      return;
    }
    const data = snap.data();
    if (!data.name || data.status === "empty") {
      listener(null);
      return;
    }
    listener({
      id: snap.id,
      name: data.name,
      nameSearch: (data.name as string).toLowerCase(),
      song: data.song,
      band: data.band ?? undefined,
      link: data.link ?? null,
      alreadySang: true,
      visitDate: data.visitDate ?? "",
      addedAt: data.addedAt?.toDate?.() ?? new Date(),
    });
  });
};

export const isStageEngaged = async (
  db: Firestore,
  storeId: string | undefined
): Promise<boolean> => {
  if (!storeId) return false;
  const snap = await getDoc(stageDoc(db, storeId));
  return snap.exists() && snap.data().status === "singing";
};

export const removeSingerFromStage = async (
  db: Firestore,
  storeId: string
): Promise<void> => {
  await setDoc(stageDoc(db, storeId), {
    name: null,
    song: null,
    band: null,
    link: null,
    visitDate: null,
    queueEntryId: null,
    status: "empty",
    updatedAt: serverTimestamp(),
  });
};

export const putSingerOnStage = async (
  db: Firestore,
  storeId: string,
  singer: QueueItem
): Promise<void> => {
  await setDoc(stageDoc(db, storeId), {
    name: singer.name,
    song: singer.song,
    band: singer.band ?? null,
    link: singer.link ?? null,
    visitDate: singer.visitDate,
    queueEntryId: singer.id ?? null,
    status: "singing",
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const markSingerAsAlreadySangById = async (
  db: Firestore,
  storeId: string,
  queueItemId: string
): Promise<void> => {
  await updateDoc(doc(queueCol(db, storeId), queueItemId), { alreadySang: true });
};

export const findSingerInQueue = async (
  db: Firestore,
  storeId: string | undefined,
  nameSearch: string
): Promise<QuerySnapshot<DocumentData> | null> => {
  if (!storeId) return null;

  return getDocs(
    query(
      queueCol(db, storeId),
      where("nameSearch", "==", nameSearch.trim().toLowerCase()),
      where("alreadySang", "==", false)
    )
  );
};

export const addSingerToQueue = async (
  db: Firestore,
  storeId: string,
  item: QueueItem
): Promise<void> => {
  await addDoc(queueCol(db, storeId), item);
};

export { QueueItem };
