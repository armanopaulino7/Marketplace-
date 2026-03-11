export type UserRole = 'adm' | 'produtor' | 'afiliado' | 'cliente';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  phone2?: string;
  created_at: string;
}
