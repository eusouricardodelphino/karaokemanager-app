/**
 * Documento do usuário na coleção "users" do Firestore.
 * Usado para perfil e permissões (ex.: isAdmin).
 */
export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
  createdAt?: string;
}
