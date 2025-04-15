import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext } from 'react';

// Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';

// Create auth context
export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={
              user ? (
                user.user_type === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <CustomerDashboard />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
