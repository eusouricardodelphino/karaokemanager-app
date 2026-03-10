/**
 * Documento da loja na coleção "stores" do Firestore.
 * Criado junto com o usuário no fluxo de cadastro em duas etapas.
 */
export interface Store {
  /** Gerado pelo Firestore ao criar o documento */
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  /** CNPJ apenas dígitos (14) ou formatado XX.XXX.XXX/XXXX-XX */
  cnpj?: string;
  /** UID do usuário superadmin dono desta loja */
  ownerId: string;
  createdAt: string;
}
