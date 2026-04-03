import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@ghands:address_book_extras_v1';

export type AddressBookExtra = {
  id: string;
  fullAddress: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
};

export async function loadAddressBookExtras(): Promise<AddressBookExtra[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendAddressBookExtra(entry: Omit<AddressBookExtra, 'id' | 'createdAt'>): Promise<void> {
  const list = await loadAddressBookExtras();
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const nextAddr = norm(entry.fullAddress);
  if (!nextAddr) return;
  if (list.some((e) => norm(e.fullAddress) === nextAddr)) return;
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  list.unshift({
    id,
    fullAddress: entry.fullAddress.trim(),
    placeId: entry.placeId,
    latitude: entry.latitude,
    longitude: entry.longitude,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}

export async function removeAddressBookExtra(id: string): Promise<void> {
  const list = await loadAddressBookExtras();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((e) => e.id !== id)));
}
