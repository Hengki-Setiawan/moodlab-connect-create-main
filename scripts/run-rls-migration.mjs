// Script to run RLS migration using Supabase Management API
import 'dotenv/config';

const PROJECT_REF = 'gowtvvaijekpgozygrzj';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_4de198c111a9f302d17b0238cef40612b55a1b87';

const migrationSQL = `
-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;

-- Policy: Everyone authenticated can view all roles
CREATE POLICY "Anyone authenticated can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can insert new roles
CREATE POLICY "Admin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Admin can update any role
CREATE POLICY "Admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Admin can delete roles
CREATE POLICY "Admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    AND NOT (user_id = auth.uid() AND role = 'admin')
);
`;

async function runMigration() {
    console.log('🚀 Running RLS migration via Supabase Management API...');
    console.log('Project Ref:', PROJECT_REF);

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query: migrationSQL })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Migration completed successfully!');
            console.log('Result:', JSON.stringify(result, null, 2));
            return;
        }

        const errorText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', errorText);

        // If the query endpoint doesn't work, try the sql endpoint
        console.log('\n📋 Trying alternative endpoint...');

        const altResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query: migrationSQL })
        });

        if (altResponse.ok) {
            const result = await altResponse.json();
            console.log('✅ Migration completed successfully via alternative endpoint!');
            console.log('Result:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ Alternative endpoint also failed');
            console.log('Status:', altResponse.status);
            console.log('Response:', await altResponse.text());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

runMigration();
