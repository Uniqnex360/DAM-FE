import { AxiosError } from "axios";
import { api } from "../lib/api";
import { ApiErrorResponse, User, UserCreate, UserUpdate } from "../types/interface";



function extractErrorMessage(error: unknown, fallback: string): Error {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    if (Array.isArray(data?.detail)) {
      const messages = data.detail.map((err: any) => {
        const field = err.loc?.[err.loc.length - 1] || "field";
        return `${field}: ${err.msg}`;
      });
      return new Error(messages.join(", "));
    }

    if (typeof data?.detail === "string") {
      return new Error(data.detail);
    }

    if (!error.response) {
      return new Error("Network error: Unable to reach the server");
    }
  }

  if (error instanceof Error) return error;
  return new Error(fallback);
}

export const userService = {
  async getAll(): Promise<User[]> {
    try {
      const { data } = await api.get<User[]>("/users/");
      return data;
    } catch (error: unknown) {
      console.error("[userService.getAll]", error);
      throw extractErrorMessage(error, "Failed to fetch users");
    }
  },

  async create(user: UserCreate): Promise<User> {
    try {
      const { data } = await api.post<User>("/users/", user);
      return data;
    } catch (error: unknown) {
      console.error("[userService.create]", error);
      throw extractErrorMessage(error, "Failed to create user");
    }
  },

  async update(id: string, user: UserUpdate): Promise<User> {
    try {
      const { data } = await api.patch<User>(`/users/${id}`, user);
      return data;
    } catch (error: unknown) {
      console.error("[userService.update]", error);
      throw extractErrorMessage(error, "Failed to update user");
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error: unknown) {
      console.error("[userService.delete]", error);
      throw extractErrorMessage(error, "Failed to delete user");
    }
  },
};