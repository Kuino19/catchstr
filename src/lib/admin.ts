import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

// Admin client that bypasses RLS. ONLY USE IN API ROUTES, NEVER IN CLIENT COMPONENTS
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key'
);

export async function logAdminAction(
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from('audit_logs').insert([{
        admin_id: session.user.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details
    }]);
}

export function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj =>
        Object.values(obj).map(val =>
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
