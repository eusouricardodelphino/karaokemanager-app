import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import type { Timestamp } from "firebase/firestore";
import type { StoreSubscription } from "@/types/store";

export type TrialStatus = "loading" | "active" | "expiring_soon" | "expired" | "paid" | "no_trial";

export interface TrialInfo {
  status: TrialStatus;
  daysLeft: number;
  trialDays: number;
}

function calcDaysLeft(trialStartedAt: Timestamp, trialDays: number): number {
  const startMs = trialStartedAt.toMillis();
  const expiresMs = startMs + trialDays * 24 * 60 * 60 * 1000;
  const remaining = expiresMs - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export function useTrial(storeId: string | undefined): TrialInfo {
  const [info, setInfo] = useState<TrialInfo>({
    status: "loading",
    daysLeft: 0,
    trialDays: 30,
  });

  useEffect(() => {
    if (!storeId) {
      setInfo({ status: "no_trial", daysLeft: 0, trialDays: 30 });
      return;
    }

    const unsub = onSnapshot(
      doc(db, "stores", storeId),
      (snap) => {
        if (!snap.exists()) {
          setInfo({ status: "no_trial", daysLeft: 0, trialDays: 30 });
          return;
        }

        const data = snap.data();
        const subscription = data.subscription as StoreSubscription | undefined;
        const trialDays: number = data.trialDays ?? 30;
        const trialStartedAt = data.trialStartedAt as Timestamp | undefined;

        if (subscription?.status === "active") {
          setInfo({ status: "paid", daysLeft: 0, trialDays });
          return;
        }

        if (!trialStartedAt) {
          setInfo({ status: "no_trial", daysLeft: 0, trialDays });
          return;
        }

        const daysLeft = calcDaysLeft(trialStartedAt, trialDays);

        if (daysLeft <= 0) {
          setInfo({ status: "expired", daysLeft: 0, trialDays });
        } else if (daysLeft <= 7) {
          setInfo({ status: "expiring_soon", daysLeft, trialDays });
        } else {
          setInfo({ status: "active", daysLeft, trialDays });
        }
      },
      () => {
        setInfo({ status: "no_trial", daysLeft: 0, trialDays: 30 });
      }
    );

    return unsub;
  }, [storeId]);

  return info;
}
