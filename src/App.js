import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import ManagerDashboard from './managersdashboard'; // Fixed case to match import
import FundiDashboard from './FundiDashboard';
import StoreManagerDashboard from './StoreManagerDashboard';
import './App.css';

function Login() {
  const [dateTime, setDateTime] = useState(new Date().toLocaleString());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const images = ['/image1.jpg', '/image2.jpg', '/image3.jpg'];
  const [bgIndex, setBgIndex] = useState(0);
  const navigate = useNavigate();
  const [role, setRole] = useState('Manager'); // Default role

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date().toLocaleString()), 1000);
    const bgTimer = setInterval(() => setBgIndex((prev) => (prev + 1) % images.length), 5000);
    return () => {
      clearInterval(timer);
      clearInterval(bgTimer);
    };
  }, [images.length]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password, role }),
        credentials: "include" // Make sure cookies/session data are included
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data));

        // Redirect based on role (normalized to lowercase for consistency)
        switch (data.role.toLowerCase()) {
          case 'manager':
            navigate('/managersdashboard');
            break;
          case 'fundi':
            navigate('/fundidashboard'); // Match Route path
            break;
          case 'store manager':
            navigate('/storemanagerdashboard'); // Match Route path
            break;
          default:
            setError('No dashboard available for this role');
            localStorage.removeItem('user'); // Clear invalid login
            break;
        }
      } else {
        // Handle specific error messages from servlet
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      // Handle network or server errors
      setError('Server connection timeout or unavailable: ' + err.message);
    }
  };

  return (
    <div className="body" style={{ backgroundImage: `url(${images[bgIndex]})` }}>
      <div className="container">
        <img src="/logo192.png" alt="Company Logo" className="logo" />
        <div className="datetime">{dateTime}</div>
        <div className="scrolling-text">
          <span>Welcome to BedPalace Furniture Workers Portal</span>
        </div>
        <p>Please log in to continue</p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="role">Select your role:</label>
          <select
            name="role"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">-- Select Role --</option>
            <option value="Manager">Manager</option>
            <option value="Store Manager">Store Manager</option>
            <option value="Fundi">Fundi</option>
          </select>
          <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="extra-options">
        <div >
          <a href="/forgot-password.html">Forgot Password?</a>
          
          </div>
          <div classname="signupbutton"> <button onClick={() => (window.location.href = 'http://localhost:8080/bedpalacemaster/signup.html')}>
            Sign Up
          </button></div>
         
         
        
        </div>
        
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/managersdashboard" element={<ManagerDashboard />} />
      <Route path="/fundidashboard" element={<FundiDashboard />} />
      <Route path="/storemanagerdashboard" element={<StoreManagerDashboard />} />
    </Routes>
  );
}

export default App;