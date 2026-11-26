import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const [authed, setAuthed] = useState<boolean>(() => isAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthed(isAuthenticated());
    };

    window.addEventListener('auth_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
