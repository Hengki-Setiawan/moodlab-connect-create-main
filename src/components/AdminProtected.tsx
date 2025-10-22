import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AdminProtectedProps {
  children: React.ReactNode;
}

export function AdminProtected({ children }: AdminProtectedProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Periksa apakah pengguna sudah login
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Jika tidak ada sesi, redirect ke halaman login
          navigate('/auth', { replace: true });
          return;
        }
        
        // Periksa apakah pengguna adalah admin
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }
        
        // Jika pengguna memiliki peran admin, izinkan akses
        if (userRoles) {
          setIsAdmin(true);
        } else {
          // Jika bukan admin, redirect ke halaman utama
          setIsAdmin(false);
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memeriksa izin admin...</span>
      </div>
    );
  }
  
  // Hanya render children jika pengguna adalah admin
  return isAdmin ? <>{children}</> : null;
}