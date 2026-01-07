import { Navigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";

const AdminRoute = ({ isAdmin, children }) => {
  if (!auth.currentUser) return <Navigate to="/" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return children;
};

export default AdminRoute;
