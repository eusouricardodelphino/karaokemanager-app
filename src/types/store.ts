import type { FieldValue, Timestamp } from "firebase/firestore";

export interface StoreSubscription {
  status: "trial" | "active" | "canceled" | "past_due";
  planId?: string;
  currentPeriodEnd?: string;
}

/**
 * Documento da loja na coleção "stores" do Firestore.
 * Criado junto com o usuário no fluxo de cadastro.
 */
export interface Store {
  /** Gerado pelo Firestore ao criar o documento */
  id?: string;
  name: string;
  /** Código único de 3 a 6 dígitos para identificar a loja (ex: 421, 3847) */
  code: string;
  logoUrl?: string;
  address?: string;
  phones?: { ddd: string; number: string; whatsapp: boolean }[];
  cnpj?: string;
  /** UID do usuário superadmin dono desta loja */
  ownerId: string;
  active: boolean;
  createdAt: string;
  /** Definido pelo servidor no momento do cadastro — nunca pelo cliente */
  trialStartedAt?: Timestamp | FieldValue;
  trialDays?: number;
  subscription?: StoreSubscription;
}
