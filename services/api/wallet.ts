import { apiClient, extractResponseData } from './client';
import type { PayForServicePayload, PayForServiceResponse } from './types';

export type { PayForServicePayload, PayForServiceResponse };

export interface Bank {
  code: string;
  name: string;
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface ResolveAccountResponse {
  accountName: string;
  accountNumber: string;
}

export const walletService = {
  getWallet: async (): Promise<{ id: number; balance: number; currency: string; isPinSet: boolean }> => {
    const response = await apiClient.get<any>('/api/wallet');
    const responseData = extractResponseData<any>(response);
    const walletData = responseData?.data || responseData;
    if (!walletData) throw new Error('Invalid response from wallet API.');
    const balance = typeof walletData.balance === 'number' ? walletData.balance : parseFloat(walletData.balance) || 0;
    return {
      id: walletData.id || 0,
      balance,
      currency: walletData.currency || 'NGN',
      isPinSet: walletData.isPinSet || false,
    };
  },

  setPin: async (payload: { pin: string; confirmPin: string }): Promise<{ message: string }> => {
    const response = await apiClient.post<any>('/api/wallet/pin', payload);
    return (response as any).data;
  },

  changePin: async (payload: { oldPin: string; newPin: string; confirmPin: string }): Promise<{ message: string }> => {
    const response = await apiClient.put<any>('/api/wallet/pin', payload);
    return (response as any).data;
  },

  verifyPin: async (pin: string): Promise<{ isValid: boolean }> => {
    const response = await apiClient.post<any>('/api/wallet/pin/verify', { pin });
    const data = extractResponseData<any>(response)?.data || extractResponseData<any>(response);
    return { isValid: data?.isValid ?? false };
  },

  initializeDeposit: async (payload: { amount: number; email: string; name?: string; phone?: string }): Promise<{ authorizationUrl: string; reference: string }> => {
    const response = await apiClient.post<any>('/api/wallet/deposit', payload);
    const responseData = extractResponseData<any>(response);
    const depositData = responseData?.data || responseData;
    if (!depositData?.authorizationUrl || !depositData?.reference) {
      throw new Error('Invalid response from deposit API. Missing authorizationUrl or reference.');
    }
    return { authorizationUrl: depositData.authorizationUrl, reference: depositData.reference };
  },

  verifyDeposit: async (reference: string): Promise<{ reference: string; status: 'completed' | 'pending' | 'failed'; amount: number; balance: number }> => {
    const response = await apiClient.get<any>(`/api/wallet/deposit/verify/${reference}`);
    const responseData = extractResponseData<any>(response);
    const verificationData = responseData?.data || responseData;
    if (!verificationData) throw new Error('Invalid response from verification API.');
    return {
      reference: verificationData.reference || reference,
      status: verificationData.status || 'pending',
      amount: verificationData.amount || 0,
      balance: verificationData.balance || 0,
    };
  },

  payForService: async (payload: PayForServicePayload): Promise<PayForServiceResponse> => {
    const response = await apiClient.post<any>('/api/wallet/pay', payload);
    return (response as any).data;
  },

  payLogisticsFee: async (payload: { requestId: number; amount: number; pin: string }): Promise<PayForServiceResponse> => {
    const response = await apiClient.post<any>('/api/wallet/pay-logistics-fee', payload);
    return (response as any)?.data?.data ?? (response as any)?.data;
  },

  withdraw: async (payload: { bankAccountId: number; amount: number; pin: string; narration?: string }): Promise<{
    reference: string;
    status: string;
    amount: number;
    balance: number;
  }> => {
    const response = await apiClient.post<any>('/api/wallet/withdraw', payload);
    const data = extractResponseData<any>(response)?.data || extractResponseData<any>(response);
    return {
      reference: data?.reference || '',
      status: data?.status || 'pending',
      amount: data?.amount || payload.amount,
      balance: data?.balance ?? 0,
    };
  },

  getBanks: async (countryCode: string = 'NG'): Promise<Bank[]> => {
    const response = await apiClient.get<any>(`/api/wallet/banks?countryCode=${encodeURIComponent(countryCode)}`);
    const data = extractResponseData<any>(response);
    const list = Array.isArray(data) ? data : (data?.data || []);
    return list.map((b: any) => ({ code: b.code || b.bankCode || '', name: b.name || b.bankName || '' }));
  },

  resolveBankAccount: async (bankCode: string, accountNumber: string): Promise<ResolveAccountResponse> => {
    const response = await apiClient.post<any>('/api/wallet/banks/resolve', { bankCode, accountNumber });
    const data = extractResponseData<any>(response)?.data || extractResponseData<any>(response);
    return {
      accountName: data?.accountName || '',
      accountNumber: data?.accountNumber || accountNumber,
    };
  },

  getBankAccounts: async (): Promise<BankAccount[]> => {
    const response = await apiClient.get<any>('/api/wallet/bank-accounts');
    const data = extractResponseData<any>(response);
    const list = Array.isArray(data) ? data : (data?.data || []);
    return list.map((a: any) => ({
      id: a.id,
      bankName: a.bankName || a.bank_name || '',
      accountNumber: a.accountNumber || a.account_number || '',
      accountName: a.accountName || a.account_name || '',
      isDefault: !!a.isDefault || !!a.is_default,
      isVerified: a.isVerified !== false && a.is_verified !== false,
    }));
  },

  addBankAccount: async (payload: { bankName: string; bankCode: string; accountNumber: string }): Promise<BankAccount> => {
    const response = await apiClient.post<any>('/api/wallet/bank-accounts', payload);
    const data = extractResponseData<any>(response)?.data || extractResponseData<any>(response);
    return {
      id: data?.id,
      bankName: data?.bankName || payload.bankName,
      accountNumber: data?.accountNumber || payload.accountNumber,
      accountName: data?.accountName || '',
      isDefault: !!data?.isDefault,
      isVerified: data?.isVerified !== false,
    };
  },

  setDefaultBankAccount: async (accountId: number): Promise<{ id: number; isDefault: boolean }> => {
    const response = await apiClient.put<any>(`/api/wallet/bank-accounts/${accountId}/default`, {});
    const data = extractResponseData<any>(response)?.data || extractResponseData<any>(response);
    return { id: data?.id ?? accountId, isDefault: true };
  },

  deleteBankAccount: async (accountId: number): Promise<void> => {
    await apiClient.delete<any>(`/api/wallet/bank-accounts/${accountId}`);
  },

  getTransactions: async (options?: { limit?: number; offset?: number }): Promise<{
    transactions: Array<{
      id: number;
      reference: string;
      type: 'deposit' | 'withdrawal' | 'payment' | 'earnings' | 'refund' | 'transfer';
      status: 'pending' | 'completed' | 'failed' | 'cancelled';
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      description: string;
      createdAt: string;
      completedAt?: string | null;
      requestId?: number | null;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> => {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const query = `?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`;
    const response = await apiClient.get<any>(`/api/wallet/transactions${query}`);
    const responseData = extractResponseData<any>(response);
    const inner = responseData?.data?.data || responseData?.data || responseData;
    return {
      transactions: inner?.transactions || [],
      total: inner?.total ?? (inner?.transactions || []).length,
      limit: inner?.limit ?? limit,
      offset: inner?.offset ?? offset,
    };
  },
};
