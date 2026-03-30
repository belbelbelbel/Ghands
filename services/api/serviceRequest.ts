import { logRatingDebug, logRatingError } from '@/utils/ratingDebugLog';
import { serializeCallApiError } from '@/utils/callDebugLog';
import { isAlreadyReviewedApiError } from '@/utils/reviewSync';

import { AuthError } from '../../utils/errors';
import { apiClient, extractResponseData } from './client';
import type {
  ServiceCategory,
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  UpdateJobDetailsPayload,
  UpdateJobDetailsResponse,
  UpdateDateTimePayload,
  UpdateDateTimeResponse,
  ServiceRequest,
  QuotationWithProvider,
} from './types';

export type {
  ServiceCategory,
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  UpdateJobDetailsPayload,
  UpdateJobDetailsResponse,
  UpdateDateTimePayload,
  UpdateDateTimeResponse,
  ServiceRequest,
  QuotationWithProvider,
};

export const serviceRequestService = {
  getCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const response = await apiClient.get<{ data?: ServiceCategory[] | { data: ServiceCategory[] }; success?: boolean }>(
        '/api/request-service/categories',
        { skipAuth: true }
      );
      if (Array.isArray((response as any).data)) return (response as any).data;
      const nestedData = (response as any).data?.data;
      return Array.isArray(nestedData) ? nestedData : [];
    } catch (error: any) {
      throw error;
    }
  },

  searchCategories: async (query: string): Promise<ServiceCategory[]> => {
    if (query.length < 2) return [];
    try {
      const response = await apiClient.get<{ data?: ServiceCategory[] | { data: ServiceCategory[] }; success?: boolean }>(
        `/api/request-service/categories/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      if (Array.isArray((response as any).data)) return (response as any).data;
      const nestedData = (response as any).data?.data;
      return Array.isArray(nestedData) ? nestedData : [];
    } catch (error: any) {
      throw error;
    }
  },

  createRequest: async (payload: CreateServiceRequestPayload): Promise<CreateServiceRequestResponse> => {
    try {
      const requestPayload: any = { categoryName: payload.categoryName };
      if (payload.jobTitle?.trim()) requestPayload.jobTitle = payload.jobTitle.trim();
      if (payload.description?.trim()) requestPayload.description = payload.description.trim();
      if (payload.comment?.trim()) requestPayload.comment = payload.comment.trim();
      const response = await apiClient.post<any>('/api/request-service/requests', requestPayload);
      const responseData = (response as any).data?.data || (response as any).data || response;
      const requestId = responseData.requestId || responseData.id || responseData.data?.requestId;
      if (!requestId) throw new Error('Invalid response from API: requestId not found');
      const id = typeof requestId === 'number' ? requestId : parseInt(requestId, 10);
      return {
        requestId: id,
        categoryName: responseData.categoryName || payload.categoryName,
        status: responseData.status || 'pending',
        message: responseData.message || 'Service request created successfully',
      };
    } catch (error) {
      throw error;
    }
  },

  updateJobDetails: async (requestId: number, payload: UpdateJobDetailsPayload): Promise<UpdateJobDetailsResponse> => {
    try {
      const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/details`, payload);
      const responseData = (response as any).data?.data || (response as any).data || response;
      if (responseData.nearbyProviders && !Array.isArray(responseData.nearbyProviders)) {
        responseData.nearbyProviders = [];
      }
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  updateDateTime: async (requestId: number, payload: UpdateDateTimePayload): Promise<UpdateDateTimeResponse> => {
    return extractResponseData<UpdateDateTimeResponse>(
      await apiClient.put<any>(`/api/request-service/requests/${requestId}/date-time`, payload)
    );
  },

  getRequestDetails: async (requestId: number): Promise<ServiceRequest> => {
    try {
      const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}`);
      const requestData = extractResponseData<ServiceRequest>(response);
      if (requestData?.nearbyProviders && !Array.isArray(requestData.nearbyProviders)) requestData.nearbyProviders = [];
      if (requestData?.status && typeof requestData.status === 'string') {
        (requestData as any).status = requestData.status.toLowerCase();
      }
      if (requestData) {
        const raw = requestData as any;
        const vr = raw.visitRequest ?? raw.visit_request;
        const rawVisitStatus =
          vr?.logisticsStatus ??
          vr?.logistics_status ??
          vr?.visitStatus ??
          vr?.visit_status ??
          raw.logisticsStatus ??
          raw.logistics_status ??
          raw.visitStatus ??
          raw.visit_status;
        const normalizedVisitStatus = typeof rawVisitStatus === 'string' ? rawVisitStatus.toLowerCase() : undefined;
        const mappedVisitStatus =
          normalizedVisitStatus === 'declined' || normalizedVisitStatus === 'rejected'
            ? 'cancelled'
            : normalizedVisitStatus;
        const hasNested = vr && (vr.scheduledDate ?? vr.scheduled_date ?? vr.logisticsCost ?? vr.logistics_cost);
        const hasFlat = raw.scheduledDate ?? raw.scheduled_date ?? raw.logisticsCost ?? raw.logistics_cost;
        const hasVisitRequestedAt = !!(raw.visitRequestedAt ?? raw.visit_requested_at ?? vr?.requestedAt ?? vr?.requested_at);
        const hasVisitStatus = !!mappedVisitStatus;
        if (hasNested || hasFlat || hasVisitRequestedAt || hasVisitStatus) {
          (requestData as any).visitRequest = {
            scheduledDate: vr?.scheduledDate ?? vr?.scheduled_date ?? raw.scheduledDate ?? raw.scheduled_date,
            scheduledTime: vr?.scheduledTime ?? vr?.scheduled_time ?? raw.scheduledTime ?? raw.scheduled_time,
            logisticsCost: vr?.logisticsCost ?? vr?.logistics_cost ?? raw.logisticsCost ?? raw.logistics_cost ?? (hasVisitRequestedAt ? 0 : undefined),
            logisticsStatus: mappedVisitStatus,
            requestedAt: vr?.requestedAt ?? vr?.requested_at ?? raw.visitRequestedAt ?? raw.visit_requested_at,
          };
        }

      }
      return requestData;
    } catch (error) {
      throw error;
    }
  },

  getUserRequests: async (status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'): Promise<ServiceRequest[]> => {
    try {
      const url = status ? `/api/request-service/requests?status=${status}` : `/api/request-service/requests`;
      const response = await apiClient.get<any>(url);
      let requests: ServiceRequest[] = [];
      if (Array.isArray(response)) requests = response;
      else if ((response as any)?.data) {
        if (Array.isArray((response as any).data)) requests = (response as any).data;
        else if (Array.isArray((response as any).data?.data)) requests = (response as any).data.data;
      }
      return requests.map((r: any) => ({ ...r, nearbyProviders: Array.isArray(r.nearbyProviders) ? r.nearbyProviders : [] }));
    } catch (error) {
      throw error;
    }
  },

  cancelRequest: async (requestId: number): Promise<{ requestId: number; status: string; message: string }> => {
    const response = await apiClient.delete<any>(`/api/request-service/requests/${requestId}`);
    const data = extractResponseData<any>(response);
    const inner = data?.data?.data ?? data?.data ?? data ?? {};
    return {
      requestId: Number(inner.requestId ?? inner.id ?? requestId) || requestId,
      status: String(inner.status ?? 'cancelled'),
      message: String(inner.message ?? 'Request cancelled.'),
    };
  },

  getAcceptedProviders: async (requestId: number): Promise<Array<{
    provider: { id: number; name: string; verified: boolean; age: number; phoneNumber: string; email: string; location: { address: string; city: string; state: string } };
    acceptance: { id: number; acceptedAt: string };
    distanceKm: number;
    minutesAway: number;
  }>> => {
    try {
      const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}/accepted-providers`);
      let providers: any[] = [];
      if (Array.isArray(response)) providers = response;
      else if ((response as any)?.data) {
        if (Array.isArray((response as any).data)) providers = (response as any).data;
        else if (Array.isArray((response as any).data?.data)) providers = (response as any).data.data;
      }
      return (providers || []).filter((p: any) => {
        const s = (p.acceptance?.status ?? p.status ?? '').toString().toLowerCase();
        return s !== 'rejected' && s !== 'declined';
      });
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase();
      if (error?.status === 400 && (msg.includes('provider.image') || msg.includes('does not exist'))) return [];
      throw error;
    }
  },

  selectProvider: async (requestId: number, providerId: number): Promise<{
    requestId: number; status: string; provider: { id: number; name: string; phoneNumber: string; email: string }; message: string;
  }> => {
    const response = await apiClient.post<any>(`/api/request-service/requests/${requestId}/select-provider`, { providerId });
    const d = extractResponseData<any>(response);
    return { requestId: d.requestId || requestId, status: d.status || 'accepted', provider: d.provider || {}, message: d.message || 'Provider selected successfully' };
  },

  getQuotations: async (requestId: number): Promise<QuotationWithProvider[]> => {
    const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}/quotations`);
    const raw = extractResponseData<any>(response);
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.quotations)) return raw.quotations;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  },

  acceptQuotation: async (quotationId: number): Promise<{ quotationId: number; requestId: number; total: number; status: 'accepted'; message: string }> => {
    const response = await apiClient.post<any>(`/api/request-service/quotations/${quotationId}/accept`);
    return (response as any).data;
  },

  rejectQuotation: async (quotationId: number): Promise<{ quotationId: number; status: 'rejected'; message: string }> => {
    const response = await apiClient.post<any>(`/api/request-service/quotations/${quotationId}/reject`);
    return (response as any).data;
  },

  completeServiceRequest: async (requestId: number): Promise<{ id: number; status: 'completed'; message: string }> => {
    const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/complete`);
    return (response as any).data;
  },

  declineVisit: async (requestId: number): Promise<{ requestId: number; visitStatus: string; message: string }> => {
    const response = await apiClient.post<any>(`/api/request-service/requests/${requestId}/decline-visit`, {});
    const data = extractResponseData<any>(response);
    return data ?? { requestId, visitStatus: 'declined', message: 'Visit declined.' };
  },

  reviewProvider: async (
    requestId: number,
    payload: { rating: number; comment?: string }
  ): Promise<any> => {
    const path = `/api/request-service/requests/${requestId}/review`;
    logRatingDebug('reviewProvider: POST', {
      path,
      requestId,
      rating: payload.rating,
      hasComment: !!payload.comment,
      commentLength: payload.comment?.length ?? 0,
    });
    try {
      const response = await apiClient.post<any>(path, payload);
      if (__DEV__) {
        const topKeys =
          response && typeof response === 'object' ? Object.keys(response as object) : typeof response;
        logRatingDebug('reviewProvider: response ok', { requestId, topLevelKeys: topKeys });
      }
      const data = extractResponseData<any>(response);
      const out = data ?? (response as any)?.data ?? response;
      logRatingDebug('reviewProvider: parsed body', {
        requestId,
        hasData: out != null,
      });
      return out;
    } catch (err) {
      if (isAlreadyReviewedApiError(err)) {
        logRatingDebug('reviewProvider: already reviewed (duplicate)', { requestId, path });
      } else {
        logRatingError('reviewProvider: failed', {
          requestId,
          path,
          ...serializeCallApiError(err),
        });
      }
      throw err;
    }
  },
};
