import { apiFetch } from "./client";
import { UserDto } from "./auth.api";

export const usersApi = {
  getAll: () => apiFetch<UserDto[]>("/users"),
};
