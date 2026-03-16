import { AuthError } from '../../utils/errors';
import { extractUserIdFromToken } from '../../utils/tokenUtils';
import { authService as authServiceInstance } from '../authService';
import { apiClient, extractResponseData } from './client';
import type {
  Provider,
  ProviderSignupPayload,
  ProviderSignupResponse,
  ProviderLoginPayload,
  ProviderLoginResponse,
  ProviderLocationPayload,
  ProviderQuotationListItem,
  Quotation,
  QuotationWithProvider,
  SendQuotationPayload,
  SendQuotationResponse,
  ServiceRequest,
  AvailableRequest,
  NearbyProvider,
} from './types';
import type { SavedLocation } from './types';

export type {
  Provider,
  ProviderSignupPayload,
  ProviderSignupResponse,
  ProviderLoginPayload,
  ProviderLoginResponse,
  ProviderLocationPayload,
  ProviderQuotationListItem,
  AvailableRequest,
};

const providerService = {
  signup: async (payload: ProviderSignupPayload): Promise<ProviderSignupResponse> => {
    const response = await apiClient.post<any>('/api/provider/signup', payload, { skipAuth: true });
    const token = response?.data?.data?.token || response?.data?.token || response?.token;
    const providerData = response?.data?.data || response?.data || response;
    const providerId = providerData?.id || (response as any)?.id || response?.data?.id;
    if (token) await authServiceInstance.setAuthToken(token);
    if (providerId) await authServiceInstance.setUserId(providerId);
    else if (token) {
      const id = extractUserIdFromToken(token);
      if (id) await authServiceInstance.setUserId(id);
    }
    return {
      id: providerId || (token ? extractUserIdFromToken(token) : undefined) || 0,
      name: providerData?.name || payload.name,
      email: providerData?.email || payload.email,
      phoneNumber: providerData?.phoneNumber || payload.phoneNumber,
      verified: providerData?.verified || false,
      age: providerData?.age || payload.age,
      token: token || '',
      message: providerData?.message || 'Provider registered successfully',
    };
  },

  login: async (payload: ProviderLoginPayload): Promise<ProviderLoginResponse> => {
    const response = await apiClient.post<any>(
      '/api/provider/login',
      { email: payload.email.trim().toLowerCase(), password: payload.password },
      { skipAuth: true }
    );
    const token = response?.data?.data?.token || response?.data?.token || response?.token;
    const providerData = response?.data?.data || response?.data || response;
    const providerId = providerData?.id || providerData?.companyId || (response as any)?.id || response?.data?.id;
    if (!token) throw new Error('Login failed: No token received from server.');
    await authServiceInstance.setAuthToken(token);
    let finalProviderId: number | undefined = undefined;
    if (providerId) {
      finalProviderId = typeof providerId === 'number' ? providerId : parseInt(providerId.toString(), 10);
      await authServiceInstance.setCompanyId(finalProviderId);
    } else if (token) {
      const id = extractUserIdFromToken(token);
      if (id) {
        finalProviderId = id;
        await authServiceInstance.setCompanyId(finalProviderId);
      }
    }
    if (finalProviderId) await authServiceInstance.setUserId(finalProviderId);
    return {
      id: finalProviderId || providerId || 0,
      name: providerData?.name || providerData?.companyName || '',
      email: providerData?.email || providerData?.companyEmail || payload.email,
      phoneNumber: providerData?.phoneNumber || providerData?.companyPhoneNumber,
      verified: providerData?.verified || false,
      age: providerData?.age || 0,
      latitude: providerData?.latitude,
      longitude: providerData?.longitude,
      formattedAddress: providerData?.formattedAddress,
      token,
      message: providerData?.message || 'Login successful',
    };
  },

  getProvider: async (providerId?: number): Promise<Provider> => {
    const response = await apiClient.get<any>('/api/provider');
    const providerData = extractResponseData<Provider>(response);
    if (providerData?.categories && !Array.isArray(providerData.categories)) providerData.categories = [];
    return providerData;
  },

  updateLocation: async (payload: ProviderLocationPayload): Promise<{ providerId: number; location: SavedLocation; message: string }> => {
    const token = await authServiceInstance.getAuthToken();
    if (!token) throw new AuthError('Authentication required. Please sign in again.');
    const requestBody: any = {};
    if (payload.placeId?.trim()) requestBody.placeId = payload.placeId.trim();
    else if (payload.latitude !== undefined && payload.longitude !== undefined && !isNaN(payload.latitude) && !isNaN(payload.longitude)) {
      requestBody.latitude = payload.latitude;
      requestBody.longitude = payload.longitude;
    } else if (payload.address?.trim()) {
      const clean = payload.address.trim().replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) throw new Error('Address is required and cannot be empty');
      requestBody.address = clean;
    } else throw new Error('Either placeId, coordinates (latitude/longitude), or address must be provided');
    const response = await apiClient.put<any>('/api/provider/location', requestBody);
    return (response as any).data;
  },

  addCategories: async (categories: string[]): Promise<{ providerId: number; categories: string[]; message: string }> => {
    const response = await apiClient.post<any>('/api/provider/categories', { categories });
    return (response as any).data;
  },

  getServices: async (providerId?: number): Promise<{ id: number; categoryName: string }[]> => {
    const provider = await providerService.getProvider(providerId);
    if (provider.categories && Array.isArray(provider.categories)) {
      return provider.categories.map((categoryName: string, i: number) => ({ id: i + 1, categoryName }));
    }
    return [];
  },

  getNearbyProviders: async (categoryName: string, latitude: number, longitude: number, maxDistanceKm = 50): Promise<NearbyProvider[]> => {
    try {
      const response = await apiClient.get<any>(
        `/api/provider/nearby?categoryName=${encodeURIComponent(categoryName)}&latitude=${latitude}&longitude=${longitude}&maxDistanceKm=${maxDistanceKm}`,
        { skipAuth: true }
      );
      return extractResponseData<NearbyProvider[]>(response) || [];
    } catch {
      return [];
    }
  },

  getAvailableRequests: async (maxDistanceKm = 50): Promise<AvailableRequest[]> => {
    const response = await apiClient.get<any>(`/api/provider/requests/available?maxDistanceKm=${maxDistanceKm}`);
    if (Array.isArray(response)) return response;
    if (Array.isArray((response as any)?.data?.data)) return (response as any).data.data;
    if (Array.isArray((response as any)?.data)) return (response as any).data;
    return [];
  },

  acceptRequest: async (requestId: number): Promise<{
    requestId: number;
    status: string;
    provider: { id: number; name: string; phoneNumber: string };
    user: { id: number; firstName: string; lastName: string; phoneNumber: string; email: string };
    message: string;
  }> => {
    const response = await apiClient.post<any>(`/api/provider/requests/${requestId}/accept`);
    return (response as any).data;
  },

  getAcceptedRequests: async (): Promise<ServiceRequest[]> => {
    try {
      const response = await apiClient.get<any>('/api/provider/requests/accepted');
      return extractResponseData<ServiceRequest[]>(response) || [];
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      return [];
    }
  },

  rejectRequest: async (requestId: number): Promise<{ requestId: number; acceptanceId: number; status: string; message: string }> => {
    try {
      const response = await apiClient.post<any>(`/api/provider/requests/${requestId}/reject`);
      return (response as any).data;
    } catch (error: any) {
      if ((error?.message || '').toLowerCase().includes('already rejected')) {
        return { requestId, acceptanceId: 0, status: 'rejected', message: 'Request was already declined.' } as any;
      }
      throw error;
    }
  },

  startWorkOrder: async (requestId: number): Promise<{ requestId: number; status: string; message?: string }> => {
    const response = await apiClient.post<any>(`/api/provider/requests/${requestId}/start`, {});
    const data = (response as any)?.data?.data ?? (response as any)?.data ?? (response as any)?.data;
    return {
      requestId,
      status: data?.status ?? 'in_progress',
      message: data?.message ?? 'Job started successfully.',
    };
  },

  markWorkComplete: async (requestId: number): Promise<{ requestId: number; status: string; message?: string }> => {
    const response = await apiClient.post<any>(`/api/provider/requests/${requestId}/complete`, {});
    const data = (response as any)?.data?.data ?? (response as any)?.data ?? (response as any)?.data;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('✅ [provider.markWorkComplete] response', {
        requestId,
        rawStatus: data?.status,
        mappedStatus: data?.status ?? 'reviewing',
      });
    }
    return {
      requestId,
      status: data?.status ?? 'reviewing',
      message: data?.message ?? 'Work marked complete. Waiting for client to confirm.',
    };
  },

  requestVisit: async (
    requestId: number,
    payload: { scheduledDate: string; scheduledTime: string; logisticsCost: number }
  ): Promise<{ requestId: number; scheduledDate: string; scheduledTime: string; logisticsCost: number; logisticsStatus: string; message: string }> => {
    const response = await apiClient.post<any>(`/api/provider/requests/${requestId}/request-visit`, payload);
    return (response as any)?.data?.data ?? (response as any)?.data;
  },

  sendQuotation: async (requestId: number, payload: SendQuotationPayload): Promise<SendQuotationResponse> => {
    const response = await apiClient.post<any>(`/api/request-service/requests/${requestId}/quotation`, payload);
    return (response as any).data;
  },

  getQuotation: async (requestId: number): Promise<Quotation> => {
    const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}/quotation`);
    const rawData = (response as any)?.data?.data || (response as any)?.data || response;
    const parseNumber = (v: any): number => {
      if (v == null) return 0;
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (typeof v === 'string') {
        const p = parseFloat(v.replace(/,/g, '').trim());
        return isNaN(p) ? 0 : p;
      }
      return 0;
    };
    return {
      ...rawData,
      id: rawData.id || 0,
      requestId: rawData.requestId || requestId,
      laborCost: parseNumber(rawData.laborCost),
      logisticsCost: parseNumber(rawData.logisticsCost),
      serviceCharge: parseNumber(rawData.serviceCharge),
      tax: parseNumber(rawData.tax),
      total: parseNumber(rawData.total),
      findingsAndWorkRequired: rawData.findingsAndWorkRequired || '',
      status: rawData.status || 'pending',
      sentAt: rawData.sentAt || new Date().toISOString(),
      acceptedAt: rawData.acceptedAt || null,
      rejectedAt: rawData.rejectedAt || null,
      message: rawData.message,
      materials: (rawData.materials || []).map((m: any) => ({
        name: m.name || '',
        quantity: parseNumber(m.quantity),
        unitPrice: parseNumber(m.unitPrice),
        total: parseNumber(m.total) || parseNumber(m.unitPrice) * parseNumber(m.quantity),
      })),
    };
  },

  getProviderQuotations: async (): Promise<ProviderQuotationListItem[]> => {
    const response = await apiClient.get<any>('/api/provider/quotations');
    return extractResponseData<ProviderQuotationListItem[]>(response) || [];
  },
};

export { providerService };
