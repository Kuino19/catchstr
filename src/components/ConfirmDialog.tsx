'use client';
import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmDialogUI({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-colors ${danger
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-primary hover:bg-blue-600 text-white'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

/** Returns a `confirm` function that opens a styled dialog instead of window.confirm */
export function useConfirm() {
    const [dialogProps, setDialogProps] = useState<(ConfirmDialogProps) | null>(null);

    const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogProps({
                ...options,
                onConfirm: () => { setDialogProps(null); resolve(true); },
                onCancel: () => { setDialogProps(null); resolve(false); },
            });
        });
    }, []);

    const DialogComponent = dialogProps ? <ConfirmDialogUI {...dialogProps} /> : null;

    return { confirm, DialogComponent };
}
