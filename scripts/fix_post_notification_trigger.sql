-- Fix: Make notifications table admin_id nullable for creator posts
-- Some triggers insert into notifications with NULL admin_id for creator actions

-- Fix the notifications table to allow NULL admin_id
ALTER TABLE public.notifications ALTER COLUMN admin_id DROP NOT NULL;

-- Update any existing triggers that might be using NEW.admin_id incorrectly
-- This ensures they work for both creator posts (no admin_id) and admin posts (has admin_id)