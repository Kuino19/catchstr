import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // Need a user token or generic select. We'll use the service role or just try anonymously since posts are public.
    console.log("Testing POST query (public)...");
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*');

    console.log("Posts:", posts ? posts.length : "None", "Error:", postsError);

    console.log("Testing SAVED query (without auth, should be blocked by RLS, but if it's syntax error it fails first)...");
    const { data: saved, error: savedError } = await supabase
        .from('saved_posts')
        .select(`
            post_id,
            posts (
                *,
                profiles (*)
            )
        `);

    console.log("Saved Posts Data:", saved);
    console.log("Saved Posts Error:", savedError);
}

test();
