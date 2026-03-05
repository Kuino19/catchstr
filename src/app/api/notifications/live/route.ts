import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Verify the caller is authenticated
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

        const { broadcasterId, broadcasterUsername, broadcasterName } = await req.json();

        // ✅ SECURITY: Ensure the caller can only send notifications for themselves
        if (broadcasterId !== user.id) {
            return NextResponse.json({ error: 'Forbidden: broadcaster ID mismatch' }, { status: 403 });
        }

        if (!broadcasterId || !broadcasterUsername) {
            return NextResponse.json({ error: 'Missing broadcaster info' }, { status: 400 });
        }

        console.log(`Sending live notifications for ${broadcasterUsername}`);

        // 1. Fetch all users who follow the broadcaster
        const { data: followers, error: followerError } = await supabaseAdmin
            .from('follows')
            .select('follower_id')
            .eq('following_id', broadcasterId);

        if (followerError) {
            throw followerError;
        }

        if (!followers || followers.length === 0) {
            return NextResponse.json({ message: 'No followers to notify', count: 0 });
        }

        // 2. Prepare the notification payload
        const displayName = broadcasterName || broadcasterUsername;
        const notifications = followers.map((f: any) => ({
            user_id: f.follower_id,
            actor_id: broadcasterId,
            type: 'live',
            content: `${displayName} is live now!`,
            link: `/live/${broadcasterUsername}`
        }));

        // 3. Bulk insert notifications
        const { error: insertError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({
            success: true,
            message: `Notified ${notifications.length} followers`,
            count: notifications.length
        });

    } catch (error: any) {
        console.error('Error sending live notifications:', error);
        return NextResponse.json({ error: error.message || 'Failed to send notifications' }, { status: 500 });
    }
}
