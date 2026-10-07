"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guaranteesApi } from "@/lib/api/procurement.api";
import { GuaranteeDto } from "@/lib/api/procurement.api";
import { GuaranteeItem, GuaranteeStatus, GuaranteeType, GuaranteeIssuerType } from "@/types";

export const guaranteesKeys = {
  all: ["guarantees"] as const,
  byRequest: (requestId: string) => ["guarantees", "request", requestId] as const,
  detail: (id: string) => ["guarantees", "detail", id] as const,
};

// Mapper from API DTO (snake_case) to Frontend Type (camelCase)
export function mapGuaranteeDtoToItem(dto: GuaranteeDto): GuaranteeItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    referenceNo: dto.reference_no,
    type: dto.type as GuaranteeType,
    value: dto.value,
    issuer: dto.issuer,
    issuerType: dto.issuer_type as GuaranteeIssuerType | undefined,
    beneficiary: dto.beneficiary,
    vendor: dto.vendor,
    issueDate: dto.issue_date,
    expiryDate: dto.expiry_date,
    pic: dto.pic,
    status: dto.status as GuaranteeStatus,
    nextAction: dto.next_action,
    fileUrl: dto.file_url_signed || dto.file_url,
  };
}

export function useGuarantees(requestId?: string) {
  return useQuery({
    queryKey: requestId ? guaranteesKeys.byRequest(requestId) : guaranteesKeys.all,
    queryFn: () => guaranteesApi.getAll(requestId).then((res) => res.data.map(mapGuaranteeDtoToItem)),
  });
}

export function useGuaranteeDetail(id: string) {
  return useQuery({
    queryKey: guaranteesKeys.detail(id),
    queryFn: () => guaranteesApi.getById(id).then((res) => mapGuaranteeDtoToItem(res.data)),
    enabled: !!id,
  });
}

export function useCreateGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<GuaranteeDto>) => guaranteesApi.add(payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guaranteesKeys.all });
    },
  });
}

export function useUpdateGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GuaranteeDto> }) =>
      guaranteesApi.update(id, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guaranteesKeys.all });
      queryClient.invalidateQueries({ queryKey: guaranteesKeys.detail(variables.id) });
    },
  });
}

export function useUploadGuaranteeWithFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, file }: { payload: Partial<GuaranteeDto>; file: File }) => {
      // 1. Create guarantee record
      const guaranteeRes = await guaranteesApi.add(payload);
      const guaranteeId = guaranteeRes.data.id;

      // 2. Get upload URL
      const urlRes = await guaranteesApi.getUploadUrl(guaranteeId, file.type);
      const { presigned_post, object_key } = urlRes.data;

      // 3. Upload to S3
      const formData = new FormData();
      Object.keys(presigned_post.fields).forEach((key) => {
        formData.append(key, presigned_post.fields[key]);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(presigned_post.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      // 4. Update guarantee with file URL key
      const updateRes = await guaranteesApi.update(guaranteeId, { file_url: object_key });
      return updateRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guaranteesKeys.all });
    },
  });
}
