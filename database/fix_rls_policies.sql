-- ============================================
-- FIX RLS POLICIES - Infinite Recursion Fix
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the problematic policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins view all users" ON users;

-- Step 2: Create a security definer function to get user role
-- This function bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role::text FROM users WHERE id = user_id;
$$;

-- Step 3: Create new policies that don't cause recursion

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Admins and managers can view all users (using the security definer function)
CREATE POLICY "Admins view all users"
ON users FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager')
);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
);

-- ============================================
-- Fix policies for other tables that reference users table
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Staff can view customers" ON customers;
DROP POLICY IF EXISTS "Staff can insert customers" ON customers;
DROP POLICY IF EXISTS "Technicians see assigned work orders" ON work_orders;
DROP POLICY IF EXISTS "Warehouse manages inventory" ON inventory;
DROP POLICY IF EXISTS "Treasurer manages treasury" ON treasury;

-- Recreate policies using the security definer function

-- Customers: Staff can view
CREATE POLICY "Staff can view customers"
ON customers FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception', 'specialist', 'treasurer')
);

-- Customers: Staff can insert
CREATE POLICY "Staff can insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception')
);

-- Customers: Staff can update
CREATE POLICY "Staff can update customers"
ON customers FOR UPDATE
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception')
);

-- Work Orders: View policy
CREATE POLICY "Staff can view work orders"
ON work_orders FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception', 'specialist', 'technician')
);

-- Inventory: Warehouse manages
CREATE POLICY "Warehouse manages inventory"
ON inventory FOR ALL
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'warehouse')
);

-- Treasury: Treasurer manages
CREATE POLICY "Treasurer manages treasury"
ON treasury FOR ALL
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'treasurer')
);

-- ============================================
-- Add permissive policies for other tables
-- ============================================

-- Vehicles
DROP POLICY IF EXISTS "Staff can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Staff can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Staff can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Staff can delete vehicles" ON vehicles;

CREATE POLICY "Staff can view vehicles"
ON vehicles FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception', 'specialist', 'technician')
);

CREATE POLICY "Staff can insert vehicles"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception')
);

CREATE POLICY "Staff can update vehicles"
ON vehicles FOR UPDATE
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception')
);

CREATE POLICY "Staff can delete vehicles"
ON vehicles FOR DELETE
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager')
);

-- Suppliers
DROP POLICY IF EXISTS "Staff can view suppliers" ON suppliers;
CREATE POLICY "Staff can view suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'warehouse')
);

-- Parts
DROP POLICY IF EXISTS "Staff can view parts" ON parts;
CREATE POLICY "Staff can view parts"
ON parts FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'warehouse', 'specialist', 'technician')
);

-- Quotations
DROP POLICY IF EXISTS "Staff can view quotations" ON quotations;
CREATE POLICY "Staff can view quotations"
ON quotations FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'reception', 'specialist')
);

-- Invoices
DROP POLICY IF EXISTS "Staff can view invoices" ON invoices;
CREATE POLICY "Staff can view invoices"
ON invoices FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'treasurer', 'reception')
);

-- Payments
DROP POLICY IF EXISTS "Staff can view payments" ON payments;
CREATE POLICY "Staff can view payments"
ON payments FOR SELECT
TO authenticated
USING (
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'treasurer')
);

-- ============================================
-- DONE! Now refresh the page
-- ============================================
