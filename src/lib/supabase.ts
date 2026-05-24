import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const fallbackUrl = Platform.select({
  android: 'http://10.0.2.2:54321',
  default: 'http://127.0.0.1:54321',
}) as string;

const fallbackPublishableKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const envKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfig = {
  publishableKey: envKey || fallbackPublishableKey,
  url: envUrl || fallbackUrl,
  usingFallback: !envUrl || !envKey,
};

export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage as never,
  },
});