import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Verify caller is authenticated
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ✅ SECURITY: Verify the caller is actually an admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
        }

        const { userId, isSuspended } = await req.json();

        if (!userId || typeof isSuspended !== 'boolean') {
            return NextResponse.json({ error: 'Missing userId or isSuspended' }, { status: 400 });
        }

        // ✅ Use admin client for privileged mutation, bypassing RLS
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_suspended: isSuspended })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        // Log the action using the admin client
        await supabaseAdmin.from('audit_logs').insert([{
            admin_id: user.id,
            action: isSuspended ? 'Suspend User' : 'Unsuspend User',
            target_type: 'user',
            target_id: userId,
            details: { new_status: isSuspended }
        }]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error suspending user:', error);
        return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
    }
}
