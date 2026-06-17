import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';

export async function createServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        async getUser() {
          return { data: { user: null }, error: null };
        },
        async exchangeCodeForSession() {
          return { data: { session: null }, error: null };
        },
        async signInWithOtp() {
          return { data: null, error: new Error('Supabase not configured') };
        },
        async signOut() {
          return { error: null };
        },
      },
    } as never;
  }

  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value) {
              cookieStore.set(name, value, options);
              return;
            }

            cookieStore.delete(name);
          });
        },
      },
    },
  );
}
