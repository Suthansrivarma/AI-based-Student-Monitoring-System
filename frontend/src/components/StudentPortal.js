import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

function StudentPortal() {
  const [events, setEvents] = useState([]);
  const [onduty, setOnduty] = useState({ reason: '', dates: [], attachment: null });
  const [myOnduty, setMyOnduty] = useState([]);
  const { logout } = useContext(AuthContext);
  const socket = io(process.env.REACT_APP_SOCKET_URL);

  useEffect(() => {
    fetchEvents();
    fetchMyOnduty();
    socket.on('notification', (data) => {
      alert(data.message);
    });
    socket.on('ondutyStatus', (data) => {
      // Only show if this student's roll number matches
      const myRoll = localStorage.getItem('rollNumber');
      if (data.rollNumber === myRoll) {
        alert(`Your onduty request is now: ${data.status}`);
        fetchMyOnduty();
      }
    });
    return () => socket.disconnect();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvents(res.data);
    } catch (err) {
      alert('Error fetching events');
    }
  };

  const fetchMyOnduty = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/onduty`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyOnduty(res.data);
    } catch (err) {
      setMyOnduty([]);
    }
  };

  const handleOndutySubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('reason', onduty.reason);
      formData.append('dates', JSON.stringify(onduty.dates));
      if (onduty.attachment) formData.append('attachment', onduty.attachment);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/onduty`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Onduty request submitted');
      setOnduty({ reason: '', dates: [], attachment: null });
      fetchMyOnduty();
    } catch (err) {
      alert('Error submitting onduty request');
    }
  };

  return (
    <div className="p-6" style={{ background: '#fffbe8', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Portal</h1>
        <button onClick={logout} className="bg-red-500 text-white p-2 rounded">
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        <ul className="mt-2">
          {events.map((event) => (
            <li key={event._id} className="p-2 border-b">
              {event.title} - {event.type} - {new Date(event.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Onduty Request</h2>
        <form onSubmit={handleOndutySubmit} className="mt-2">
          <div className="mb-4">
            <label className="block text-gray-700">Reason</label>
            <textarea
              value={onduty.reason}
              onChange={(e) => setOnduty({ ...onduty, reason: e.target.value })}
              className="w-full p-2 border rounded"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Dates</label>
            <input
              type="date"
              onChange={(e) => setOnduty({ ...onduty, dates: [e.target.value] })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Attachment (PDF/Image)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setOnduty({ ...onduty, attachment: e.target.files[0] })}
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Submit Request
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">My Onduty Requests</h2>
        <ul className="mt-2">
          {myOnduty.map((req) => (
            <li key={req._id} className="p-2 border-b">
              {req.reason} | {req.dates.map((d) => new Date(d).toLocaleDateString()).join(', ')} | Status: <span className={`font-bold ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{req.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StudentPortal;