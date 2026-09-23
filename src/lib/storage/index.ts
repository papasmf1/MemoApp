import { StorageAdapter } from '@/lib/types';
import { LocalStorageRepository } from './local-storage';
import { SupabaseStorageRepository } from './supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function getStorage(isUserLoggedIn: boolean = false): StorageAdapter {
  if (isUserLoggedIn && isSupabaseConfigured()) {
    return SupabaseStorageRepository;
  }
  return LocalStorageRepository;
}
