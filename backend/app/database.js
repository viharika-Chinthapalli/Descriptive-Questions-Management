/**
 * Supabase database connection and client setup.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", "..", ".env") });
dotenv.config();

// Get Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  if (!DATABASE_URL) {
    console.warn(
      "SUPABASE_URL and SUPABASE_ANON_KEY are not set.\n" +
        "Please set them in your .env file.\n" +
        "Get your credentials from: Supabase Dashboard → Settings → API"
    );
  }
}

// Initialize Supabase client
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
    },
  });
  console.log("Supabase client initialized");
} else {
  console.warn(
    "Supabase client not initialized. Using DATABASE_URL for direct PostgreSQL connection."
  );
}

/**
 * Initialize database connection and verify connectivity.
 *
 * @returns {Promise<void>}
 */
export async function initDb() {
  try {
    if (!supabase) {
      throw new Error(
        "Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file.\n" +
          "Get your credentials from: Supabase Dashboard → Settings → API"
      );
    }

    // Test Supabase connection
    const { data, error } = await supabase.from("questions").select("id").limit(1);
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      // PGRST116 and 42P01 are "relation does not exist" - that's okay, tables will be created
      // Only throw if it's a different error (like auth failure)
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        throw new Error(
          "Supabase authentication failed. Please check your SUPABASE_ANON_KEY.\n" +
            "Get your key from: Supabase Dashboard → Settings → API"
        );
      }
      // For other errors, log but don't fail (table might not exist yet)
      console.warn("Supabase connection test warning:", error.message);
    }
    console.log("Supabase connection verified");
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error(`Database initialization error: ${errorMsg}`);

    if (errorMsg.includes("could not translate host name") || errorMsg.includes("getaddrinfo")) {
      console.error(
        "DNS Resolution Error: Cannot connect to Supabase.\n" +
          "Possible solutions:\n" +
          "1. Check if your Supabase project is paused - restore it at https://supabase.com/dashboard\n" +
          "2. Verify your SUPABASE_URL is correct in .env file\n" +
          "3. Check your network/firewall settings"
      );
    } else if (errorMsg.includes("password") || errorMsg.includes("authentication")) {
      console.error(
        "Authentication Error: Cannot authenticate with Supabase.\n" +
          "Possible solutions:\n" +
          "1. Verify your SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY is correct\n" +
          "2. Check your .env file"
      );
    } else {
      console.error(
        "Database connection failed.\n" +
          "Please check:\n" +
          "1. Supabase project is active (not paused)\n" +
          "2. SUPABASE_URL and SUPABASE_ANON_KEY in .env file are correct\n" +
          "3. Network connectivity to Supabase"
      );
    }
    throw error;
  }
}

/**
 * Get Supabase client instance.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Please check your SUPABASE_URL and SUPABASE_ANON_KEY in .env file."
    );
  }
  return supabase;
}

export default supabase;

