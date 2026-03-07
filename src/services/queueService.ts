import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  QuerySnapshot,
  DocumentData,
  Firestore,
} from "firebase/firestore";

export interface QueueItem {
  id?: string;
  name: string;
  nameSearch: string;
  song: string;
  band?: string;
  alreadySang: boolean;
  visitDate: string;
  onStage?: boolean;
  link?: string | null;
  addedAt: Date;
  restaurantId: string;
}

type Unsubscribe = () => void;

export const subscribeToQueue = (
  db: Firestore,
  restaurantId: string | undefined,
  listener: (items: QueueItem[]) => void
): Unsubscribe | void => {
  if (!restaurantId) return;

  const q = query(
    collection(db, "queue"),
    where("alreadySang", "==", false),
    where("restaurantId", "==", restaurantId),
    orderBy("addedAt", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list: QueueItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as QueueItem),
    }));
    listener(list);
  });

  return unsubscribe;
};

export const subscribeToOnStageSinger = (
  db: Firestore,
  restaurantId: string | undefined,
  listener: (singer: QueueItem | null) => void
): Unsubscribe | void => {
  if (!restaurantId) return;

  const q = query(
    collection(db, "onStage"),
    where("onStage", "==", true),
    where("restaurantId", "==", restaurantId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const singers: QueueItem[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as QueueItem),
    }));
    listener(singers[0] ?? null);
  });

  return unsubscribe;
};

export const isStageEngaged = async (
  db: Firestore,
  restaurantId: string | undefined
): Promise<boolean> => {
  if (!restaurantId) return false;

  const q = query(
    collection(db, "onStage"),
    where("onStage", "==", true),
    where("restaurantId", "==", restaurantId)
  );

  const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);
  return !snapshot.empty;
};

export const markSingerAsAlreadySang = async (
  db: Firestore,
  singer: QueueItem
): Promise<void> => {
  if (!singer.id) return;
  const ref = doc(db, "queue", singer.id);
  await updateDoc(ref, { alreadySang: true });
};

export const removeSingerFromStage = async (
  db: Firestore,
  singer: QueueItem
): Promise<void> => {
  if (!singer.id) return;
  const ref = doc(db, "onStage", singer.id);
  await updateDoc(ref, { onStage: false });
};

export const putSingerOnStage = async (
  db: Firestore,
  singer: QueueItem
): Promise<void> => {
  const { id, ...data } = singer;
  await addDoc(collection(db, "onStage"), { ...data, onStage: true });
};

export const findSingerInQueue = async (
  db: Firestore,
  restaurantId: string | undefined,
  nameSearch: string
): Promise<QuerySnapshot<DocumentData>> => {
  if (!restaurantId) {
    // retorna snapshot vazio compatível quando não houver restaurantId
    const q = query(collection(db, "queue"), where("restaurantId", "==", "__none__"));
    return getDocs(q);
  }

  const q = query(
    collection(db, "queue"),
    where("nameSearch", "==", nameSearch.trim().toLowerCase()),
    where("alreadySang", "==", false),
    where("restaurantId", "==", restaurantId)
  );

  return getDocs(q);
};

export const addSingerToQueue = async (
  db: Firestore,
  item: QueueItem
): Promise<void> => {
  await addDoc(collection(db, "queue"), item);
};

