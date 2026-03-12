/**
 * Documento do usuário na coleção "users" do Firestore.
 * Usado para perfil e permissões.
 */
export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  /** @deprecated Use role === 'owner'. Mantido por compatibilidade com documentos existentes. */
  isAdmin?: boolean;
  /** Role explícita do usuário. 'owner' para donos de loja, 'staff' para funcionários, 'singer' para cantores. */
  role?: "owner" | "staff" | "singer";
  /** ID da loja vinculada ao usuário no cadastro */
  storeId?: string;
  createdAt?: string;
}

/** Verifica se o usuário tem permissão de dono (mesmo comportamento que isAdmin antes). */
export function isOwner(user: AppUser | null): boolean {
  return (user?.role === "owner") || (user?.isAdmin === true);
}
