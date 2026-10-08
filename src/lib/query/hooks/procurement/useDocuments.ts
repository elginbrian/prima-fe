"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, DocumentDto } from "@/lib/api/documents.api";
import { DocumentItem, DocumentType, DocumentStatus, ProcurementStep, DocumentKind } from "@/types";

export const documentsKeys = {
  all: ["documents"] as const,
  byRequest: (requestId: string) => ["documents", "request", requestId] as const,
};

export function mapDocumentDtoToItem(dto: DocumentDto): DocumentItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    name: dto.name,
    type: dto.type as DocumentType,
    documentKind: dto.document_kind as DocumentKind,
    status: dto.status as DocumentStatus,
    uploadDate: dto.upload_date,
    pic: { id: dto.pic_id, name: dto.pic_name },
    issues: dto.issues,
    nextAction: dto.next_action,
    procurementStep: dto.procurement_step as ProcurementStep,
    documentDate: dto.document_date,
    documentNumber: dto.document_number,
    fileUrl: dto.file_url,
    mimeType: dto.mime_type,
  };
}

export function useDocuments(requestId?: string) {
  return useQuery({
    queryKey: requestId ? documentsKeys.byRequest(requestId) : documentsKeys.all,
    queryFn: () => documentsApi.getAll(requestId).then((res) => res.data.map(mapDocumentDtoToItem)),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DocumentDto> }) =>
      documentsApi.update(id, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}
