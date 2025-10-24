import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface StaffProtectedProps {
  children: React.ReactNode;
}

export function StaffProtected({ children }: StaffProtectedProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth', { replace: true });
          return;
        }

        const { data: isAdmin, error: errAdmin } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin',
        });

        if (!errAdmin && isAdmin === true) {
          setAllowed(true);
        } else {
          const { data: isModerator, error: errModerator } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'moderator',
          });
          if (!errModerator && isModerator === true) {
            setAllowed(true);
          } else {
            setAllowed(false);
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error in staff check:', error);
        setAllowed(false);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memeriksa akses...</span>
      </div>
    );
  }

  return allowed ? <>{children}</> : null;
}
