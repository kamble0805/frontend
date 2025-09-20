import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, trucksAPI, customersAPI, ordersAPI, dispatchesAPI, materialsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Truck, Users, Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [entities, setEntities] = useState({
    trucks: [],
    customers: [],
    orders: [],
    dispatches: [],
    materials: []
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'delete'
  const [modalEntity, setModalEntity] = useState(''); // 'truck', 'customer', etc.
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpi, trucks, customers, orders, dispatches, materials] = await Promise.all([
        dashboardAPI.getKPI(),
        trucksAPI.getAll(),
        customersAPI.getAll(),
        ordersAPI.getAll(),
        dispatchesAPI.getAll(),
        materialsAPI.getAll()
      ]);
      
      setKpiData(kpi);
      setEntities({
        trucks: trucks.results || trucks,
        customers: customers.results || customers,
        orders: orders.results || orders,
        dispatches: dispatches.results || dispatches,
        materials: materials.results || materials
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // CRUD Operations
  const openModal = (type, entity, item = null) => {
    setModalType(type);
    setModalEntity(entity);
    setSelectedItem(item);
    
    if (type === 'edit' && item) {
      setFormData(item);
    } else {
      // Reset form data for new items
      const defaultFormData = {
        truck: { number_plate: '', capacity: '', driver_name: '', status: 'idle' },
        customer: { name: '', contact: '', email: '' },
        order: { customer: '', material_type: '', quantity: '', status: 'pending' },
        material: { name: '', stock_quantity: '', unit: 'tons' },
        dispatch: { truck: '', order: '', operator: '', status: 'assigned' }
      };
      setFormData(defaultFormData[entity] || {});
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalEntity('');
    setSelectedItem(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'add') {
        await addEntity();
      } else if (modalType === 'edit') {
        await updateEntity();
      }
      closeModal();
      loadDashboardData();
    } catch (error) {
      console.error('Error saving:', error);
      window.alert('Failed to save. Please try again.');
    }
  };

  const addEntity = async () => {
    const apiMap = {
      truck: trucksAPI.create,
      customer: customersAPI.create,
      order: ordersAPI.create,
      material: materialsAPI.create,
      dispatch: dispatchesAPI.create
    };
    
    await apiMap[modalEntity](formData);
      window.alert(`${modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)} created successfully!`);
      
      // Show workflow notifications for specific entities
      if (modalEntity === 'order') {
        window.alert('Order created! A truck will be automatically assigned if available.');
      }
  };

  const updateEntity = async () => {
    const apiMap = {
      truck: trucksAPI.update,
      customer: customersAPI.update,
      order: ordersAPI.update,
      material: materialsAPI.update,
      dispatch: dispatchesAPI.update
    };
    
    await apiMap[modalEntity](selectedItem.id, formData);
    window.alert(`${modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)} updated successfully!`);
  };

  const deleteEntity = async (entity, item) => {
    if (!window.confirm(`Are you sure you want to delete this ${entity}?`)) return;
    
    try {
      const apiMap = {
        truck: trucksAPI.delete,
        customer: customersAPI.delete,
        order: ordersAPI.delete,
        material: materialsAPI.delete,
        dispatch: dispatchesAPI.delete
      };
      
      await apiMap[entity](item.id);
      window.alert(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully!`);
      loadDashboardData();
    } catch (error) {
      console.error('Error deleting:', error);
      window.alert('Failed to delete. Please try again.');
    }
  };

  const assignDispatchOperator = async (dispatchId, operatorId) => {
    try {
      await dispatchesAPI.assignOperator(dispatchId, operatorId);
      window.alert('Operator assigned successfully!');
      loadDashboardData();
    } catch (error) {
      console.error('Error assigning operator:', error);
      window.alert('Failed to assign operator. Please try again.');
    }
  };

  const updateMaterialStock = async (materialId, newQuantity) => {
    try {
      const material = entities.materials.find(m => m.id === materialId);
      if (material) {
        await materialsAPI.update(materialId, {
          ...material,
          stock_quantity: newQuantity
        });
        window.alert('Stock updated successfully!');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      window.alert('Failed to update stock. Please try again.');
    }
  };

  const chartColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const orderStatusData = [
    { name: 'Completed', value: kpiData?.completed_orders_today || 0, color: '#10b981' },
    { name: 'Pending', value: kpiData?.pending_orders || 0, color: '#f59e0b' },
    { name: 'In Progress', value: kpiData?.active_dispatches || 0, color: '#3b82f6' }
  ];

  const materialStockData = Object.entries(kpiData?.material_stock_summary || {}).map(([name, data]) => ({
    name,
    quantity: data.quantity,
    unit: data.unit
  }));

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>MineFlow Admin</h2>
        </div>
        <div className="nav-user">
          <span>Welcome, {user?.first_name || user?.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage your mining operations and system settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'trucks' ? 'active' : ''}`}
            onClick={() => setActiveTab('trucks')}
          >
            Trucks
          </button>
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button 
            className={`tab-button ${activeTab === 'dispatches' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatches')}
          >
            Dispatches
          </button>
          <button 
            className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            Materials
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Total Trucks</h4>
                  <span className="stat-number">{kpiData?.total_trucks || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Package className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Active Dispatches</h4>
                  <span className="stat-number">{kpiData?.active_dispatches || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Completed Today</h4>
                  <span className="stat-number">{kpiData?.completed_orders_today || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Avg Delivery Time</h4>
                  <span className="stat-number">{kpiData?.average_delivery_time || 0}h</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Unresolved Issues</h4>
                  <span className="stat-number">{kpiData?.unresolved_exceptions || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Users className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Pending Orders</h4>
                  <span className="stat-number">{kpiData?.pending_orders || 0}</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-container">
              <div className="chart-card">
                <h3>Order Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Material Stock Levels</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={materialStockData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'trucks' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>Trucks Management</h2>
              <button 
                className="add-button"
                onClick={() => openModal('add', 'truck')}
              >
                Add Truck
              </button>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Number Plate</th>
                    <th>Driver</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.trucks.map(truck => (
                    <tr key={truck.id}>
                      <td>{truck.number_plate}</td>
                      <td>{truck.driver_name}</td>
                      <td>{truck.capacity} tons</td>
                      <td>
                        <span className={`status-badge ${truck.status}`}>
                          {truck.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button edit"
                          onClick={() => openModal('edit', 'truck', truck)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => deleteEntity('truck', truck)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>Orders Management</h2>
              <button 
                className="add-button"
                onClick={() => openModal('add', 'order')}
              >
                Add Order
              </button>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.material_type}</td>
                      <td>{order.quantity} tons</td>
                      <td>
                        <span className={`status-badge ${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button edit"
                          onClick={() => openModal('edit', 'order', order)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => deleteEntity('order', order)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dispatches' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>Dispatches Management</h2>
              <button 
                className="add-button"
                onClick={() => openModal('add', 'dispatch')}
              >
                Create Dispatch
              </button>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Dispatch ID</th>
                    <th>Truck</th>
                    <th>Order</th>
                    <th>Operator</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.dispatches.map(dispatch => (
                    <tr key={dispatch.id}>
                      <td>#{dispatch.id}</td>
                      <td>{dispatch.truck_number_plate}</td>
                      <td>Order #{dispatch.order}</td>
                      <td>{dispatch.operator_name || 'Unassigned'}</td>
                      <td>
                        <span className={`status-badge ${dispatch.status}`}>
                          {dispatch.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button edit"
                          onClick={() => openModal('edit', 'dispatch', dispatch)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button assign"
                          onClick={() => {
                            const operatorId = window.prompt('Enter Operator ID to assign:');
                            if (operatorId) assignDispatchOperator(dispatch.id, operatorId);
                          }}
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>Materials Management</h2>
              <button 
                className="add-button"
                onClick={() => openModal('add', 'material')}
              >
                Add Material
              </button>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stock Quantity</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.materials.map(material => (
                    <tr key={material.id}>
                      <td>{material.name}</td>
                      <td>{material.stock_quantity}</td>
                      <td>{material.unit}</td>
                      <td>
                        <span className={`status-badge ${material.stock_quantity < 10 ? 'low' : 'good'}`}>
                          {material.stock_quantity < 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button edit"
                          onClick={() => openModal('edit', 'material', material)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button restock"
                          onClick={() => {
                            const newQuantity = window.prompt(`Enter new stock quantity for ${material.name}:`);
                            if (newQuantity && !isNaN(newQuantity)) {
                              updateMaterialStock(material.id, parseFloat(newQuantity));
                            }
                          }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Operations */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>
                  {modalType === 'add' ? 'Add' : 'Edit'} {modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)}
                </h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {renderFormFields()}
                </div>
                <div className="modal-footer">
                  <button type="button" className="action-button cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="action-button submit">
                    {modalType === 'add' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render form fields based on entity type
  function renderFormFields() {
    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    switch (modalEntity) {
      case 'truck':
        return (
          <>
            <div className="form-group">
              <label>Number Plate:</label>
              <input
                type="text"
                value={formData.number_plate || ''}
                onChange={(e) => handleInputChange('number_plate', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Driver Name:</label>
              <input
                type="text"
                value={formData.driver_name || ''}
                onChange={(e) => handleInputChange('driver_name', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Capacity (tons):</label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity || ''}
                onChange={(e) => handleInputChange('capacity', parseFloat(e.target.value))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={formData.status || 'idle'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-input"
              >
                <option value="idle">Idle</option>
                <option value="in_transit">In Transit</option>
              </select>
            </div>
          </>
        );

      case 'customer':
        return (
          <>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Contact:</label>
              <input
                type="text"
                value={formData.contact || ''}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="form-input"
              />
            </div>
          </>
        );

      case 'order':
        return (
          <>
            <div className="form-group">
              <label>Customer:</label>
              <select
                value={formData.customer || ''}
                onChange={(e) => handleInputChange('customer', parseInt(e.target.value))}
                className="form-input"
                required
              >
                <option value="">Select Customer</option>
                {entities.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Material Type:</label>
              <input
                type="text"
                value={formData.material_type || ''}
                onChange={(e) => handleInputChange('material_type', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity (tons):</label>
              <input
                type="number"
                step="0.1"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-input"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </>
        );

      case 'material':
        return (
          <>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity:</label>
              <input
                type="number"
                step="0.1"
                value={formData.stock_quantity || ''}
                onChange={(e) => handleInputChange('stock_quantity', parseFloat(e.target.value))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Unit:</label>
              <select
                value={formData.unit || 'tons'}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="form-input"
              >
                <option value="tons">Tons</option>
                <option value="kg">Kilograms</option>
                <option value="lbs">Pounds</option>
              </select>
            </div>
          </>
        );

      case 'dispatch':
        return (
          <>
            <div className="form-group">
              <label>Truck:</label>
              <select
                value={formData.truck || ''}
                onChange={(e) => handleInputChange('truck', parseInt(e.target.value))}
                className="form-input"
                required
              >
                <option value="">Select Truck</option>
                {entities.trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    {truck.number_plate} - {truck.driver_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Order:</label>
              <select
                value={formData.order || ''}
                onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                className="form-input"
                required
              >
                <option value="">Select Order</option>
                {entities.orders.map(order => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id} - {order.customer_name} ({order.material_type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={formData.status || 'assigned'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-input"
              >
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </>
        );

      default:
        return <div>Form not implemented for {modalEntity}</div>;
    }
  }
};

export default AdminDashboard;
