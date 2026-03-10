
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let client = null;

if (supabaseUrl && supabaseKey) {
    try {
        client = createClient(supabaseUrl, supabaseKey);
        logger.info('✅ Supabase Client Initialized');
    } catch (err) {
        logger.error('Failed to initialize Supabase client', err);
    }
} else {
    logger.warn('⚠️ Supabase credentials missing. Running in memory-only mode.');
}

export const supabase = client;
