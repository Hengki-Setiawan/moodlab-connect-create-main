---
description: Database architecture guide - Turso vs Supabase data separation
---

# MoodLab Database Architecture Guide

This document explains the database architecture of the MoodLab website. **Read this first** before making any database-related changes.

## Overview

MoodLab uses **two databases** for cost optimization:

| Database | Purpose | Free Tier |
|----------|---------|-----------|
| **Turso (LibSQL)** | Main data storage | High free tier (9GB, 500M rows) |
| **Supabase** | Auth, Storage, User Management | Limited free tier |

## Data Separation Rules

### ✅ TURSO (LibSQL) - Main Data
Store ALL business data here:

```
📦 Turso Database
├── products          # All product listings
├── reviews           # Product reviews
├── orders            # Order transactions
├── order_items       # Items in each order (if needed)
├── consultations     # Consultation requests
└── pages             # CMS page content
```

**Connection file**: `src/lib/turso.ts`  
**Schema file**: `src/db/schema.ts`  
**Environment variables**:
- `VITE_TURSO_DATABASE_URL`
- `VITE_TURSO_AUTH_TOKEN`

### ✅ SUPABASE - Auth & User Management
Store ONLY authentication-related data here:

```
📦 Supabase Database
├── auth.users        # User authentication (built-in)
├── profiles          # User profiles (linked to auth.users)
├── user_roles        # User roles (admin, moderator, user)
├── page_contents     # CMS editable content (optional)
├── page_views        # Analytics (optional)
└── Storage buckets   # Image/file uploads
```

**Connection file**: `src/integrations/supabase/client.ts`  
**Types file**: `src/integrations/supabase/types.ts`  
**Environment variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Quick Reference Table

| Data Type | Database | File Location |
|-----------|----------|---------------|
| Products | **Turso** | `src/db/schema.ts` → `products` |
| Reviews | **Turso** | `src/db/schema.ts` → `reviews` |
| Orders | **Turso** | `src/db/schema.ts` → `orders` |
| Consultations | **Turso** | `src/db/schema.ts` → `consultations` |
| User Auth | **Supabase** | Built-in `auth.users` |
| User Profiles | **Supabase** | `profiles` table |
| User Roles | **Supabase** | `user_roles` table |
| Images/Files | **Supabase Storage** | Bucket: "Gambar" |

## Code Examples

### Fetching Products (TURSO)
```typescript
import { db } from "@/lib/turso";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get all products
const allProducts = await db.select().from(products);

// Get product by ID
const product = await db.select().from(products).where(eq(products.id, productId));
```

### Fetching User Profiles (SUPABASE)
```typescript
import { supabase } from "@/integrations/supabase/client";

// Get all profiles (admin only)
const { data, error } = await supabase.from("profiles").select("*");

// Get current user profile
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
```

### Uploading Images (SUPABASE STORAGE)
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.storage
  .from("Gambar")
  .upload(`products/${fileName}`, file);
```

## Common Issues & Solutions

### Issue: "Gagal memuat data pengguna" (User Management)
**Cause**: Missing RLS policy for admin to view all profiles
**Solution**: Run migration `20260129_add_admin_profiles_policy.sql`

### Issue: "Produk tidak ditemukan" (Product Detail)
**Cause**: Product not in Turso database OR wrong ID type
**Solution**: 
1. Check product exists in Turso: `SELECT * FROM products WHERE id = X`
2. Turso uses INTEGER IDs, not UUIDs

### Issue: Image not loading
**Cause**: Supabase Storage bucket permissions
**Solution**: Ensure "Gambar" bucket has public SELECT policy

## RLS (Row Level Security) Notes

### Supabase Tables with RLS:
- `profiles`: Users see own profile, admins see all
- `user_roles`: Users see own role, admins see all
- Storage "Gambar": Public read, authenticated write

### Key RLS Policies for Admin:
```sql
-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
```

## Adding New Features - Checklist

1. [ ] Determine which database to use (refer to table above)
2. [ ] If Turso: Update `src/db/schema.ts` and run `npm run db:push`
3. [ ] If Supabase: Create migration in `supabase/migrations/`
4. [ ] Update TypeScript types if needed
5. [ ] Add proper error handling in components
6. [ ] Test both locally and in production

## Environment Variables

Ensure these are set in `.env` and Vercel:

```env
# Turso
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-token

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## File Structure Reference

```
src/
├── db/
│   └── schema.ts           # Turso/Drizzle schema
├── lib/
│   └── turso.ts            # Turso connection
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client
│       ├── types.ts        # Supabase types
│       ├── storage.ts      # Storage utilities
│       └── admin.ts        # Admin-specific functions
└── components/
    └── admin/
        ├── UsersManagement.tsx    # Uses SUPABASE
        ├── AdminProductManager.tsx # Uses TURSO
        └── ...
```

// turbo-all
