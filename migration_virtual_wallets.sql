-- Migration for Virtual Gifting Wallet System

-- Virtual Wallet table to hold coin balances
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id uuid REFERENCES auth.users(id) PRIMARY KEY,
    balance integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wallet Transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES auth.users(id),       -- Who sent the gift or bought coins
    receiver_id uuid REFERENCES auth.users(id),     -- Who received the gift (if applicable)
    amount integer NOT NULL,                        -- Positive for purchase/receive, negative for gift/spend
    transaction_type text NOT NULL,                 -- 'purchase', 'gift', 'reward'
    reference_id text,                              -- ID of the gift item or payment intent
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can view their own wallet."
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Users can read transactions involving them
CREATE POLICY "Users can view their own transactions."
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Function to handle gifting (debit sender, credit receiver) securely via RPC
CREATE OR REPLACE FUNCTION send_virtual_gift(
    p_sender_id uuid,
    p_receiver_id uuid,
    p_amount integer,
    p_gift_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as DB admin to circumvent RLS for the exact update
AS $$
DECLARE
    v_sender_balance integer;
BEGIN
    -- 1. Check sender balance
    SELECT balance INTO v_sender_balance
    FROM public.wallets
    WHERE user_id = p_sender_id;

    IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- 2. Deduct from sender
    UPDATE public.wallets
    SET balance = balance - p_amount, updated_at = now()
    WHERE user_id = p_sender_id;

    -- 3. Add to receiver (create wallet if it doesn't exist)
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_receiver_id, p_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = public.wallets.balance + p_amount, updated_at = now();

    -- 4. Log transactions
    INSERT INTO public.wallet_transactions (sender_id, receiver_id, amount, transaction_type, reference_id)
    VALUES 
        (p_sender_id, p_receiver_id, -p_amount, 'gift_sent', p_gift_id),
        (p_sender_id, p_receiver_id, p_amount, 'gift_received', p_gift_id);

    RETURN true;
END;
$$;
