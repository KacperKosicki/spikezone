import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { firebaseUser, mongoUser, authLoading, backendDown } = useAuth();

  if (authLoading) return null; // albo loader

  if (backendDown) return <Navigate to="/backend-offline" replace />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!mongoUser) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
