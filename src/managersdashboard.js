import React, { useState, useEffect, useRef } from 'react';
import './Managerdashboard.css';
import { useNavigate } from 'react-router-dom';

function ManagerDashboard() {
  const [managerData, setManagerData] = useState({
    dailyTasks: [],
    allTasks: [],
    pendingTasks: [],
    fundiUsers: [],
    inventory: [],
    name: '',
    profilePicture: ''
  });
 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [dateTime, setDateTime] = useState(new Date().toLocaleString());
  const [dailyActivities, setDailyActivities] = useState([
    { id: 1, task: 'Review daily sales report', checked: false },
    { id: 2, task: 'Check inventory levels', checked: false },
    { id: 3, task: 'Assign tasks to team', checked: false },
    { id: 4, task: 'Approve pending orders', checked: false },
    { id: 5, task: 'sign team register', checked: false },
  ]);
  // Added for attendance
  const [attendance, setAttendance] = useState({});
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState('');

  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'Manager') {
      const fundiUsers = user.fundiUsers || [];
      setManagerData({
        dailyTasks: user.dailyTasks || [],
        allTasks: user.allTasks || [],
        pendingTasks: user.pendingTasks || [],
        fundiUsers,
        inventory: user.inventory || [],
        name: user.name || '',
        profilePicture: user.profilePicture || ''
      });
      setActivePage('dashboard');
      // Initialize attendance
      const initialAttendance = {};
      fundiUsers.forEach((fundi) => {
        initialAttendance[fundi.id] = false;
      });
      setAttendance(initialAttendance);
    } else {
      
      navigate('/');
    }

    const timer = setInterval(() => setDateTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  const handleActivityCheckboxChange = (id) => {
    setDailyActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, checked: !activity.checked } : activity
      )
    );
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleActions = () => setIsActionsOpen(!isActionsOpen);
  const changePage = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  // Attendance handlers
  const handleAttendanceChange = (fundiId) => {
    setAttendance((prev) => ({
      ...prev,
      [fundiId]: !prev[fundiId],
    }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setAttendanceError('');
    setAttendanceSuccess('');
  
    try {
      // Validate attendance data
      if (Object.keys(attendance).length === 0) {
        throw new Error('No Fundis available to record attendance.');
      }
  
      const attendanceRecords = Object.entries(attendance).map(([fundiId, present]) => {
        const userId = parseInt(fundiId);
        if (isNaN(userId) || userId <= 0) {
          throw new Error(`Invalid Fundi ID: ${fundiId}`);
        }
        return {
          userId,
          present: Boolean(present),
          date: new Date().toISOString().split('T')[0],
        };
      });
  
      // Log request for debugging
      console.log('Sending attendance:', JSON.stringify({ attendance: attendanceRecords }, null, 2));
  
      const response = await fetch('http://localhost:8080/bedpalacemaster/FundiAttendanceServlet', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendance: attendanceRecords }),
      });
  
      // Read response as text first to handle invalid JSON
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }
  
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }
  
      if (result.success) {
        setAttendanceSuccess('Attendance recorded successfully!');
        const resetAttendance = {};
        managerData.fundiUsers.forEach((fundi) => {
          resetAttendance[fundi.id] = false;
        });
        setAttendance(resetAttendance);
      } else {
        throw new Error(result.error || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setAttendanceError(`Failed to save attendance: ${err.message}`);
    }
  };

  return (
    <div className="manager-dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="scrolling-text">
            <span>BedPalace Manager Portal</span>
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
                <li onClick={() => (window.location.href = 'http://localhost:8080/bedpalacemaster/taskassignment.jsp')}>
                  Assign Task
                </li>
                <li onClick={() => alert('View Reports clicked')}>View Reports</li>
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</li>
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>☰</button>

      {/* Sidebar */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
        <ul>
          <li onClick={() => changePage('dashboard')} className={activePage === 'dashboard' ? 'active' : ''}>
            <span className="icon">🏠</span> Dashboard
          </li>
          <li onClick={() => changePage('allTasks')} className={activePage === 'allTasks' ? 'active' : ''}>
            <span className="icon">📋</span> All Tasks ({managerData.allTasks.length})
          </li>
          <li onClick={() => changePage('pendingTasks')} className={activePage === 'pendingTasks' ? 'active' : ''}>
            <span className="icon">⏳</span> Pending Tasks ({managerData.pendingTasks.length})
          </li>
          <li onClick={() => changePage('fundi')} className={activePage === 'fundi' ? 'active' : ''}>
            <span className="icon">👥</span> Fundi Attendance ({managerData.fundiUsers.length})
          </li>
          <li onClick={() => changePage('inventory')} className={activePage === 'inventory' ? 'active' : ''}>
            <span className="icon">📦</span> View Inventory
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? 'shifted' : ''}`}>
        {activePage === 'dashboard' && (
          <section className="dashboard-container">
            <div className="dashboard-left">
              <div className="profile-container">
                <img
                  src={managerData.profilePicture || '/profilepic1.jpg'}
                  alt="Profile"
                  className="profile-picture"
                />
                <div className="text-container">
                  <div className="datetime">{dateTime}</div>
                  <div className="managertext">
                    <h2>Welcome, {managerData.name || 'Manager'}</h2>
                  </div>
                </div>
              </div>
              <div className="daily-activities">
                <h3>Daily Activities</h3>
                <ul className="activity-list">
                  {dailyActivities.map((activity) => (
                    <li key={activity.id} className="activity-item">
                      <input
                        type="checkbox"
                        checked={activity.checked}
                        onChange={() => handleActivityCheckboxChange(activity.id)}
                      />
                      <span>{activity.task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="image-container">
                <img
                  src="/image1.jpg"
                  alt="Dashboard Footer"
                  className="footer-image"
                />
              </div>
            </div>
            <div className="dashboard-right">
              <h2>Insights</h2>
              <div className="image-section">
                <h4>Sales Trends</h4>
                <img src="/image3.jpg" alt="Sales Trend" className="dashboard-image" />
              </div>
              <div className="image-section">
                <h4>Team Performance</h4>
                <img src="/image2.jpg" alt="Team Performance" className="dashboard-image" />
              </div>
              <div className="image-section">
                <h4>Customer Feedback</h4>
                <img src="/image1.jpg" alt="Customer Feedback" className="dashboard-image" />
              </div>
            </div>
            <div className="events-overview">
              <h3>Events Overview</h3>
              <div className="events-grid">
                <div className="event-card">
                  <span className="event-icon">📦</span>
                  <h4>Orders Given</h4>
                  <p>12</p>
                </div>
                <div className="event-card">
                  <span className="event-icon">🚚</span>
                  <h4>Deliveries to be Done</h4>
                  <p>5</p>
                </div>
                <div className="event-card">
                  <span className="event-icon">❌</span>
                  <h4>Missed Events</h4>
                  <p>3</p>
                </div>
                <div className="event-card">
                  <span className="event-icon">⏰</span>
                  <h4>Upcoming Events</h4>
                  <p>8</p>
                </div>
                <div className="event-card calendar-card">
                  <span className="event-icon">📅</span>
                  <h4>Planning Calendar</h4>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </section>
        )}
        {activePage === 'allTasks' && (
          <section className="tasks-page">
            <h2>All Tasks</h2>
            <TaskTable tasks={managerData.allTasks} />
          </section>
        )}
        {activePage === 'inventory' && (
          <section className="inventory-page">
            <h2>Inventory</h2>
            <InventoryTable inventory={managerData.inventory} />
          </section>
        )}
        {activePage === 'dailyTasks' && (
          <section className="tasks-page">
            <h2>Daily Tasks</h2>
            <TaskTable tasks={managerData.dailyTasks} />
          </section>
        )}
        {activePage === 'pendingTasks' && (
          <section className="tasks-page">
            <h2>Pending Tasks</h2>
            <TaskTable tasks={managerData.pendingTasks} />
          </section>
        )}
        {activePage === 'fundi' && (
          <section className="fundi-page">
            <h2>Fundi Attendance Register</h2>
            {attendanceError && <p className="error">{attendanceError}</p>}
            {attendanceSuccess && <p className="success">{attendanceSuccess}</p>}
            {managerData.fundiUsers.length === 0 ? (
              <p>No Fundis available.</p>
            ) : (
              <form onSubmit={handleSubmitAttendance}>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerData.fundiUsers.map((fundi) => (
                      <tr key={fundi.id}>
                        <td>{fundi.name}</td>
                        <td>{fundi.id}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={attendance[fundi.id] || false}
                            onChange={() => handleAttendanceChange(fundi.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="submit" className="submit-btn">
                  Save Attendance
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 BedPalace Furniture. All rights reserved.</p>
      </footer>
    </div>
  );
}

function InventoryTable({ inventory = [] }) {
  return (
    <section>
      <h2>Inventory</h2>
      {inventory.length > 0 ? (
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Date Last Checked</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={item.ID || index} className="inventory-table-row">
                <td>{item.itemId}</td>
                <td>{item.itemName}</td>
                <td>{item.stockQuantity}</td>
                <td>{item.dateLastChecked}</td>
                <td>{item.quantityStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No inventory data available.</p>
      )}
    </section>
  );
}

function TaskTable({ tasks = [] }) {
  const [payableAmounts, setPayableAmounts] = useState(
    tasks.reduce((acc, task) => ({
      ...acc,
      [task.taskId]: task.paymentAmount || '',
    }), {})
  );

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isManager = user.role === 'Manager';

  const handleAmountChange = (taskId, value) => {
    setPayableAmounts((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const updateTaskPayment = async (taskId) => {
    const amount = payableAmounts[taskId];
    if (!amount || isNaN(amount) || Number(amount) < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/UpdateTaskPaymentServlet', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          paymentAmount: Number(amount),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update payment: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment');
      }

      alert('Payment amount updated successfully!');
    } catch (err) {
      console.error('Error updating payment:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="task-table-container">
      <table className="task-table">
        <thead className="task-table-header">
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Amount Payable ($)</th>
            {isManager && <th>Action</th>}
          </tr>
        </thead>
        <tbody className="task-table-body">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={isManager ? 6 : 5}>No tasks available.</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.taskId} className="task-table-row">
                <td>{task.taskId}</td>
                <td>{task.description}</td>
                <td>{task.status}</td>
                <td>{task.assignedTo || 'Unassigned'}</td>
                <td>
                  {isManager ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payableAmounts[task.taskId] || ''}
                      onChange={(e) => handleAmountChange(task.taskId, e.target.value)}
                      placeholder="Enter amount"
                      className="task-table-input"
                    />
                  ) : (
                    task.paymentAmount ? task.paymentAmount.toFixed(2) : 'Not set'
                  )}
                </td>
                {isManager && (
                  <td>
                    <button
                      onClick={() => updateTaskPayment(task.taskId)}
                      className="task-table-btn"
                    >
                      Save
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManagerDashboard;