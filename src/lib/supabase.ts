import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseServiceKey) {
  throw new Error("Missing env.SUPABASE_SERVICE_KEY")
}

// Important: We are using the service key here for admin-level access to bypass RLS.
// This is necessary for the server-side logic (e.g., in API routes) to have full control
// over storage and database operations.
//
// NEVER expose the service key on the client side.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // We are managing auth with NextAuth, so we disable Supabase's auto-refresh
    // to avoid conflicts.
    autoRefreshToken: false,
    persistSession: false,
  },
})
