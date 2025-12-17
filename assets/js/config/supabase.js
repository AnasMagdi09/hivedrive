/**
 * HiveDrive - Supabase Configuration
 */

const SUPABASE_URL = 'https://txqjvdliuzwcrsnhhauz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWp2ZGxpdXp3Y3JzbmhoYXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODUzOTgsImV4cCI6MjA4MTU2MTM5OH0.xrvz2SxnTyisc0Tu8nyrSpKwb9bLUeqjmMF_1qImc_I';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.db = supabase;
window.SUPABASE_URL = SUPABASE_URL;
