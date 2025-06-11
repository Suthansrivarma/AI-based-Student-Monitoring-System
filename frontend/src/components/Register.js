import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/register`, formData);
      alert('Registration successful, awaiting admin approval');
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amazon animate-fadeIn">
      <div className="card-amazon register-card">
        <h1 className="text-4xl font-extrabold text-amazon text-center mb-8 animate-gradient-x">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-amazon mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-amazon mb-2">Roll Number</label>
            <input
              type="text"
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-amazon mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-amazon mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-amazon mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <button type="submit" className="btn-amazon w-full">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;