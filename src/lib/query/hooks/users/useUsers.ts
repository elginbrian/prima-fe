import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import type { UserDto } from "@/lib/api";
import type { User } from "@/types";

export function mapUserToDomain(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    phone: dto.phone,
    department: dto.department,
    avatarUrl: dto.avatar_url,
    createdAt: dto.created_at,
    lastLogin: dto.last_login,
  };
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.auth.users(),
    queryFn: () => usersApi.getAll().then((res) => res.data.map(mapUserToDomain)),
  });
}
