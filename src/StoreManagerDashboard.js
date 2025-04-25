import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StoreManagerDashboard.css';

function StoreManagerDashboard() {
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState({ itemName: '', stockQuantity: '', dateLastChecked: '' });
  const [editingItems, setEditingItems] = useState({}); // Replace editingRows with stateful items
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'Store Manager') {
      fetchInventory();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/InventoryServlet', {
        method: 'GET',
        credentials: 'include',
      });
      console.log('Fetch Status:', response.status);
      const data = await response.json();
      console.log('Fetch Response:', data);
      if (!response.ok || data.success === false) {
        setError(data.message || 'Failed to fetch inventory');
        setInventory([]);
      } else {
        setInventory(data.inventory || []);
        setError('');
      }
    } catch (err) {
      setError('Error fetching inventory: ' + err.message);
      setInventory([]);
      console.error('Fetch Error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: name === 'stockQuantity' ? (value === '' ? '' : parseInt(value) || 0) : value,
    }));
  };

  const addStock = async (e) => {
    e.preventDefault();
    console.log('Sending:', newItem);
    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/InventoryServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'add', ...newItem }),
        credentials: 'include',
      });
      console.log('Add Status:', response.status);
      const data = await response.json();
      console.log('Add Response:', data);
      if (!response.ok || data.success === false) {
        setError(data.message || 'Failed to add stock');
      } else {
        setMessage(data.message);
        setNewItem({ itemName: '', stockQuantity: '', dateLastChecked: '' });
        fetchInventory();
      }
    } catch (err) {
      setError('Error adding stock: ' + err.message);
      console.error('Fetch Error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/LogoutServlet', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('Logout Status:', response.status);
      const data = await response.json();
      console.log('Logout Response:', data);
      if (!response.ok || data.success === false) {
        console.warn('Logout failed but proceeding:', data.message);
      }
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const enableEdit = (item) => {
    setEditingItems((prev) => ({
      ...prev,
      [item.itemId]: { ...item },
    }));
  };

  const handleEditChange = (itemId, field, value) => {
    setEditingItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: field === 'stockQuantity' ? (value === '' ? '' : parseInt(value) || 0) : value,
      },
    }));
  };

  const saveEdit = async (itemId) => {
    const updatedItem = editingItems[itemId];
    try {
      const response = await fetch('http://localhost:8080/bedpalacemaster/InventoryServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'update', ...updatedItem }),
        credentials: 'include',
      });
      console.log('Update Status:', response.status);
      const data = await response.json();
      console.log('Update Response:', data);
      if (!response.ok || data.success === false) {
        setError(data.message || 'Failed to update item');
      } else {
        setMessage(data.message);
        setEditingItems((prev) => {
          const newState = { ...prev };
          delete newState[itemId];
          return newState;
        });
        fetchInventory();
      }
    } catch (err) {
      setError('Error saving changes: ' + err.message);
      console.error('Update Error:', err);
    }
  };

  const deleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch('http://localhost:8080/bedpalacemaster/InventoryServlet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'delete', itemId }),
          credentials: 'include',
        });
        console.log('Delete Status:', response.status);
        const data = await response.json();
        console.log('Delete Response:', data);
        if (!response.ok || data.success === false) {
          setError(data.message || 'Failed to delete item');
        } else {
          setMessage(data.message);
          fetchInventory();
        }
      } catch (err) {
        setError('Error deleting item: ' + err.message);
        console.error('Delete Error:', err);
      }
    }
  };

  return (
    <div className="store-manager-dashboard">
      <div className="container">
        <header className="dashboard-header">
          <h2>Store Manager - Inventory Management</h2>
          <div className="navbar-right">
            <img src="/logo192.png" alt="Company Logo" className="logo" />
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="form-container">
          <h3>Add New Stock</h3>
          <form onSubmit={addStock}>
            <input
              type="text"
              name="itemName"
              placeholder="Item Name"
              value={newItem.itemName}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="stockQuantity"
              placeholder="Stock Quantity"
              value={newItem.stockQuantity}
              onChange={handleInputChange}
              min="0"
              required
            />
            <input
              type="date"
              name="dateLastChecked"
              value={newItem.dateLastChecked}
              onChange={handleInputChange}
              required
            />
            <input type="submit" value="Add Stock" />
          </form>
        </div>

        <h3>Stored Inventory</h3>
        {inventory.length > 0 ? (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Stock Quantity</th>
                <th>Date Last Checked</th>
                <th>Quantity Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.itemId}>
                  <td>{item.itemId}</td>
                  <td>
                    <input
                      type="text"
                      value={editingItems[item.itemId]?.itemName ?? item.itemName}
                      onChange={(e) => handleEditChange(item.itemId, 'itemName', e.target.value)}
                      disabled={!editingItems[item.itemId]}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editingItems[item.itemId]?.stockQuantity ?? item.stockQuantity}
                      onChange={(e) => handleEditChange(item.itemId, 'stockQuantity', e.target.value)}
                      min="0"
                      disabled={!editingItems[item.itemId]}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editingItems[item.itemId]?.dateLastChecked ?? item.dateLastChecked}
                      onChange={(e) => handleEditChange(item.itemId, 'dateLastChecked', e.target.value)}
                      disabled={!editingItems[item.itemId]}
                    />
                  </td>
                  <td>{item.quantityStatus}</td>
                  <td>
                    <button
                      className="edit"
                      onClick={() => enableEdit(item)}
                      style={{ display: editingItems[item.itemId] ? 'none' : 'inline' }}
                    >
                      Edit
                    </button>
                    <button
                      className="save"
                      onClick={() => saveEdit(item.itemId)}
                      style={{ display: editingItems[item.itemId] ? 'inline' : 'none' }}
                    >
                      Save
                    </button>
                    <button className="delete" onClick={() => deleteItem(item.itemId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No inventory data available.</p>
        )}
      </div>
    </div>
  );
}

export default StoreManagerDashboard;