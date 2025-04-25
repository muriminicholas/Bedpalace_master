import React, { useState, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './FundiDashboard.css';

function FundiDashboard() {
  const [fundiName, setFundiName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionMenuRef = useRef(null); 
  const toggleActions = () => setIsActionsOpen(!isActionsOpen);
  useEffect(() => {
    const handleClickOutside = (event) => {
      
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    };
    // Retrieve user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'Fundi') {
      setFundiName(user.name);
      const userTasks = user.tasks;
      setTasks(userTasks);
      console.log('Tasks from localStorage:', userTasks); // Debug
      if (userTasks.length === 0) {
        setError('No pending tasks available.');
      }
    } else {
      navigate('/');
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const handleLogout = () => {
    fetch('http://localhost:8080/bedpalacemaster/LogoutServlet', {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        localStorage.removeItem('user');
        navigate('/');
      })
      .catch((err) => {
        console.error('Logout error:', err);
        localStorage.removeItem('user');
        navigate('/');
      });
  };

  const handleTaskComplete = async (taskId) => {
    try {
      // Update local state optimistically
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.taskId === taskId ? { ...task, status: 'Completed' } : task
        )
      );

      console.log(`Sending request to update task_id: ${taskId}`);
      const response = await fetch('http://localhost:8080/bedpalacemaster/UpdateTaskStatusServlet', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: taskId,
          status: 'Completed',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fetch failed: Status ${response.status}, Response: ${errorText}`);
        throw new Error(`Failed to update task status: ${errorText}`);
      }

      const result = await response.json();
      console.log('UpdateTaskStatusServlet response:', result);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task status');
      }

      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.tasks) {
        user.tasks = user.tasks.map((task) =>
          task.taskId === taskId ? { ...task, status: 'Completed' } : task
        );
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.taskId === taskId ? { ...task, status: 'Pending' } : task
        )
      );
      setError(`Failed to update task status: ${err.message}`);
    }
  };

  return (
    <div className="fundi-dashboard">
      
      <header className="dashboard-header">
      <div className='fundisname'>Welcome, {fundiName}!</div>
        <div className="header-left">
          <div className="scrolling-text">
            <span>BedPalace Fundi Portal</span>
          </div>
        </div>
        <div className="header-center">
          <img src="/logo192.png" alt="Company Logo" className="logo" />
        </div>
        <div className="header-right">
          <div className="action-bar" ref={actionMenuRef}>
            <button className="action-btn" onClick={toggleActions}>⚙</button>
            {isActionsOpen && (
              <ul className="action-menu">
              <li onClick={() => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    console.error('Error parsing user from localStorage:', e);
  }
  console.log('User from localStorage:', user);
  if (user && user.userId) {
    window.location.href = `http://localhost:8080/bedpalacemaster/payments.jsp?user_Id=${user.userId}`;
  } else {
    alert('Please log in to view payments.');
  }
}}>
  payments</li>
               
                <li className="logout-btn" onClick={handleLogout}>
                Logout</li>
              </ul>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>Tasks for Today ({new Date().toLocaleDateString()})</h2>
        {error && <p className="error">{error}</p>}
        {tasks.length === 0 ? (
          <p>No tasks for today.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Complete</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId}>
                  <td>{task.taskId}</td>
                  <td>{task.description}</td>
                  <td>{task.status}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => handleTaskComplete(task.taskId)}
                      disabled={task.status === 'Completed'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default FundiDashboard;