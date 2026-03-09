export type UserRole = 'adm' | 'produtor' | 'afiliado' | 'cliente';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
