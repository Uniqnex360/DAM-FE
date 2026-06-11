export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface UserCreate extends Omit<User, "id"> {
  password: string;
}

export type UserUpdate = Partial<UserCreate>;


export interface ApiErrorResponse {
  detail: string;
}
