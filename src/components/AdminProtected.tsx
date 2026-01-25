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
        
        // Periksa admin via RPC has_role (bypass RLS)
        const { data: hasRole, error } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        });
        
        if (error) {
          console.error('Error checking admin status via RPC:', error);
          setIsAdmin(false);
          navigate('/', { replace: true });
          return;
        }
        
        if (hasRole === true) {
          setIsAdmin(true);
        } else {
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