export type UserRole = 'adm' | 'produtor' | 'afiliado' | 'cliente';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  full_name?: string;
  phone?: string;
  phone2?: string;
  created_at: string;
  last_seen?: string;
}
