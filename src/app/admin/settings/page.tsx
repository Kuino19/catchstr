'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';

interface Setting {
    key: string;
    value: any;
    description: string;
    updated_at: string;
}

export default function settingsPage() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (data && !error) {
            setSettings(data);
        }
        setLoading(false);
    }

    async function updateSetting(key: string, newValue: any) {
        setSaving(key);
        const { error } = await supabase
            .from('system_settings')
            .update({ value: newValue, updated_at: new Date() })
            .eq('key', key);

        if (!error) {
            setSettings(settings.map(s => s.key === key ? { ...s, value: newValue, updated_at: new Date().toISOString() } : s));
            logAdminAction('Update System Setting', 'setting', key, { new_value: newValue });
        }
        setSaving(null);
    }

    const renderSettingInput = (setting: Setting) => {
        if (typeof setting.value === 'boolean' || setting.value === 'true' || setting.value === 'false') {
            const boolVal = setting.value === true || setting.value === 'true';
            return (
                <button
                    onClick={() => updateSetting(setting.key, !boolVal)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 ring-offset-[#0f172a] ${boolVal ? 'bg-primary' : 'bg-slate-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${boolVal ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            );
        }

        if (typeof setting.value === 'object' && setting.value !== null) {
            // Special handling for announcement banner
            if (setting.key === 'announcement_banner') {
                return (
                    <div className="space-y-4 w-full">
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] uppercase font-black text-slate-500">Active</label>
                            <button
                                onClick={() => updateSetting(setting.key, { ...setting.value, active: !setting.value.active })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.value.active ? 'bg-primary' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.value.active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <textarea
                            value={setting.value.text}
                            onChange={(e) => setSettings(settings.map(s => s.key === setting.key ? { ...s, value: { ...s.value, text: e.target.value } } : s))}
                            onBlur={(e) => updateSetting(setting.key, { ...setting.value, text: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white h-24"
                            placeholder="Banner message text..."
                        />
                    </div>
                );
            }
        }

        return (
            <input
                type="text"
                value={typeof setting.value === 'string' ? setting.value.replace(/"/g, '') : JSON.stringify(setting.value)}
                onBlur={(e) => updateSetting(setting.key, e.target.value)}
                onChange={(e) => setSettings(settings.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white w-full max-w-md"
            />
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">settings_suggest</span>
                    PLATFORM ENGINE
                </h1>
                <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Configure global system behavior and vital signs.</p>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse"></div>
                    ))
                ) : (
                    settings.map((setting) => (
                        <div key={setting.key} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm group transition-all hover:border-white/10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-1 max-w-md">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-white uppercase tracking-tight text-lg">{setting.key.replace(/_/g, ' ')}</h3>
                                        {saving === setting.key && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">{setting.description}</p>
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-4">
                                        Last Adjusted: {new Date(setting.updated_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex-1 flex justify-end">
                                    {renderSettingInput(setting)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-8 bg-primary/5 border border-primary/10 rounded-3xl flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">emergency_home</span>
                </div>
                <div>
                    <h4 className="font-bold text-white">Emergency Broadcast</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Activation of Maintenance Mode will immediately disconnect all non-administrative personnel from the live environment.</p>
                </div>
            </div>
        </div>
    );
}
