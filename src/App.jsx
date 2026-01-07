import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "./firebase/firebaseConfig";
import { db } from "./firebase/firebaseConfig";

const checkAdmin = async () => {
  const user = auth.currentUser;
  if (!user) return false;

  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() && snap.data().role === "admin";
};


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
