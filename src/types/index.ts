export type UserRole = 'adm' | 'produtor' | 'afiliado' | 'cliente';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  full_name?: string;
  phone?: string;
  phone2?: string;
  iban_private?: string;
  bank_name_private?: string;
  holder_name_private?: string;
  created_at: string;
  last_seen?: string;
}
