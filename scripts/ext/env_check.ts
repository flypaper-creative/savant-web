/**
 * SAVANT_ENV_VALIDATOR // scripts/ext/env_check.ts
 */

import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_KEYS = [
  'GEMINI_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'APP_URL'
];

function validate() {
  console.log('--- SCANNING_ENVIRONMENT_LATTICE ---');
  const missing = REQUIRED_KEYS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('[ERROR] Missing critical uplink keys:', missing.join(', '));
    process.exit(1);
  }
  
  console.log('[STATUS] All neural keys verified. System ready for boot.');
}

validate();
