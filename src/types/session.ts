import type { Timestamp, FieldValue } from "firebase/firestore";

export type SessionStatus = "open" | "closed";

/** Documento gravado no Firestore em stores/{storeId}/rooms/{roomId}/sessions/{YYYY-MM-DD} */
export interface Session {
  date: string;                          // "YYYY-MM-DD" — igual ao ID do documento
  status: SessionStatus;
  openedAt: Timestamp | FieldValue;
  openedBy: string;                      // UID de quem abriu
  closedAt?: Timestamp | FieldValue | null;
  closedBy?: string | null;
}

/** Versão client-side com id incluído (após leitura do Firestore) */
export interface SessionSnapshot extends Omit<Session, "openedAt" | "closedAt"> {
  id: string;                            // == date
  openedAt: Timestamp;
  closedAt?: Timestamp | null;
}
