-- ==============================================================================
-- ?? AURA FRAGRANCES — SUPABASE CLOUD DATABASE SCHEMA
-- Run this in Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery (COD)',
    items TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'PKR',
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public to place orders
CREATE POLICY "Allow public insert to orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow select on orders" 
ON public.orders 
FOR SELECT 
TO anon, authenticated
USING (true);

-- 2. Create VIP Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to subscribers" 
ON public.subscribers 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow select on subscribers" 
ON public.subscribers 
FOR SELECT 
TO anon, authenticated
USING (true);
