import '../login.css';
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-image">
          {/* Main left-side image */}
          <img src="/mcet-main.png" alt="MCET Main" className="login-logo" style={{maxWidth:'100%', borderRadius:'1.5rem'}} />
        </div>
        <div className="login-form-section">
          {/* Top logo */}
          <img src="/mcet-small.png" alt="MCET Logo" className="login-logo" />
          <div className="login-title">Dr. Mahalingam College of Engineering and Technology</div>
          <form onSubmit={handleSubmit} className="login-form">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <Link to="/register" className="login-link">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;