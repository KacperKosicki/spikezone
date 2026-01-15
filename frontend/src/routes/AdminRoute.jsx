import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { firebaseUser, mongoUser, authLoading, backendDown, mongoSyncLoading } = useAuth();

  if (authLoading || mongoSyncLoading) return null; // ewentualnie loader
  if (backendDown) return <Navigate to="/backend-offline" replace />;

  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!mongoUser) return <Navigate to="/login" replace />;

  if (mongoUser?.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;
