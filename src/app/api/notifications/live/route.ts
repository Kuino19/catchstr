import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin'; // Use admin client to bypass RLS for inserting bulk notifications

export async function POST(req: Request) {
    try {
        const { broadcasterId, broadcasterUsername, broadcasterName } = await req.json();

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
