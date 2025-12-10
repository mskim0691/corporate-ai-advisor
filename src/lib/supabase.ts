import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Only create client if env vars are present
// This allows the file to be imported conditionally without throwing errors
let supabaseClient = null

if (supabaseUrl && supabaseServiceKey) {
  // Important: We are using the service key here for admin-level access to bypass RLS.
  // This is necessary for the server-side logic (e.g., in API routes) to have full control
  // over storage and database operations.
  //
  // NEVER expose the service key on the client side.
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // We are managing auth with NextAuth, so we disable Supabase's auto-refresh
      // to avoid conflicts.
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const supabase = supabaseClient
