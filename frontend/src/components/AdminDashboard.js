import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [onduty, setOnduty] = useState([]);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', type: '' });
  const { logout } = useContext(AuthContext);
  const socket = io(process.env.REACT_APP_SOCKET_URL);

  useEffect(() => {
    fetchData();
    socket.on('attendanceUpdate', (data) => {
      setAttendance((prev) => [...prev, data]);
    });
    socket.on('notification', (data) => {
      alert(data.message);
    });
    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [studentsRes, attendanceRes, ondutyRes, eventsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/students`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/admin/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/onduty`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStudents(studentsRes.data);
      setAttendance(attendanceRes.data);
      setOnduty(ondutyRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      alert('Error fetching data');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/approve`,
        { userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchData();
    } catch (err) {
      alert('Error approving student');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/deactivate`,
        { userId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchData();
    } catch (err) {
      alert('Error deactivating student');
    }
  };

  const handleOndutyAction = async (ondutyId, status) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/onduty/action`,
        { ondutyId, status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchData();
    } catch (err) {
      alert('Error updating onduty status');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/events`,
        newEvent,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNewEvent({ title: '', description: '', date: '', type: '' });
      fetchData();
    } catch (err) {
      alert('Error adding event');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amazon animate-fadeIn">
      <div className="w-full max-w-5xl card-amazon">
        <h1 className="text-5xl font-extrabold text-amazon text-center mb-10 animate-gradient-x">Admin Dashboard</h1>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Daily Attendance</h2>
          <ul className="mt-2">
            {attendance.map((record) => (
              <li key={record._id} className="p-2 border-b text-gray-800 font-semibold">
                {record.name} ({record.rollNumber}) - {record.date ? new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'No Time'}
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Student Management</h2>
          <table className="w-full mt-2 border bg-white bg-opacity-80 rounded-lg shadow-lg animate-fadeIn">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-gradient-x">
                <th className="p-2">Name</th>
                <th className="p-2">Roll Number</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-yellow-100 transition-colors duration-200">
                  <td className="p-2 font-semibold text-gray-800">{student.name}</td>
                  <td className="p-2 text-gray-700">{student.rollNumber}</td>
                  <td className="p-2 text-gray-700">{student.email}</td>
                  <td className="p-2 text-gray-700">{student.isApproved ? 'Approved' : 'Pending'}</td>
                  <td className="p-2">
                    {!student.isApproved && (
                      <button
                        onClick={() => handleApprove(student._id)}
                        className="bg-green-500 text-white p-1 rounded mr-2 hover:bg-green-700 transition-colors duration-200 shadow-md"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeactivate(student._id)}
                      className="bg-red-500 text-white p-1 rounded hover:bg-red-700 transition-colors duration-200 shadow-md"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Onduty Requests</h2>
          <table className="w-full mt-2 border bg-white bg-opacity-80 rounded-lg shadow-lg animate-fadeIn">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-gradient-x">
                <th className="p-2">Roll Number</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Dates</th>
                <th className="p-2">Attachment</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {onduty.map((request) => (
                <tr key={request._id} className="hover:bg-yellow-100 transition-colors duration-200">
                  <td className="p-2 font-semibold text-gray-800">{request.rollNumber}</td>
                  <td className="p-2 text-gray-700">{request.reason}</td>
                  <td className="p-2 text-gray-700">{request.dates.map((d) => new Date(d).toLocaleDateString()).join(', ')}</td>
                  <td className="p-2">
                    {request.attachment ? (
                      <a href={`${process.env.REACT_APP_API_URL.replace('/api', '')}/uploads/${request.attachment.split(/[/\\]/).pop()}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors duration-200">View</a>
                    ) : (
                      <span className="text-gray-400">No File</span>
                    )}
                  </td>
                  <td className={`p-2 font-bold ${request.status === 'approved' ? 'text-green-600' : request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600 animate-pulse'}`}>{request.status}</td>
                  <td className="p-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleOndutyAction(request._id, 'approved')}
                          className="bg-green-500 text-white p-1 rounded mr-2 hover:bg-green-700 transition-colors duration-200 shadow-md"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOndutyAction(request._id, 'rejected')}
                          className="bg-red-500 text-white p-1 rounded hover:bg-red-700 transition-colors duration-200 shadow-md"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-6 event-management-form">
          <h2 className="text-2xl font-bold mb-2">Event Management</h2>
          <form onSubmit={handleAddEvent} className="mt-2 space-y-4">
            <div>
              <label className="block text-lg font-semibold text-amazon mb-2">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-amazon mb-2">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full"
              ></textarea>
            </div>
            <div>
              <label className="block text-lg font-semibold text-amazon mb-2">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-amazon mb-2">Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="w-full"
                required
              >
                <option value="">Select Type</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
            <button type="submit" className="btn-amazon w-full">
              Add Event
            </button>
          </form>
          <ul className="mt-4">
            {events.map((event) => (
              <li key={event._id} className="event-list-item">
                {event.title} - {event.type} - {new Date(event.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;