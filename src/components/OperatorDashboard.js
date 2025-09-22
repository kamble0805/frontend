import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dispatchesAPI, exceptionsAPI } from '../services/api';
import { Truck, Package, AlertTriangle, Clock, CheckCircle, MapPin } from 'lucide-react';
import ImageUpload from './ImageUpload';
import './Dashboard.css';

const OperatorDashboard = () => {
  const { user, logout } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dispatches');
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowStep, setWorkflowStep] = useState('');
  const [workflowData, setWorkflowData] = useState({});
  const [workflowImages, setWorkflowImages] = useState([]);
  const [exceptionForm, setExceptionForm] = useState({
    description: '',
    exception_type: 'General'
  });

  useEffect(() => {
    loadOperatorData();
  }, []);

  const loadOperatorData = async () => {
    try {
      setLoading(true);
      const [dispatchesData, exceptionsData] = await Promise.all([
        dispatchesAPI.getAll(),
        exceptionsAPI.getAll()
      ]);
      
      setDispatches(dispatchesData.results || dispatchesData);
      setExceptions(exceptionsData.results || exceptionsData);
    } catch (error) {
      console.error('Error loading operator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const openWorkflowModal = (dispatch, step) => {
    setSelectedDispatch(dispatch);
    setWorkflowStep(step);
    setWorkflowData({});
    setWorkflowImages([]);
    setShowWorkflowModal(true);
  };

  const closeWorkflowModal = () => {
    setShowWorkflowModal(false);
    setSelectedDispatch(null);
    setWorkflowStep('');
    setWorkflowData({});
    setWorkflowImages([]);
  };

  const executeWorkflowStep = async () => {
    try {
      let result;
      const dataWithImages = { ...workflowData, images: workflowImages };
      
      switch (workflowStep) {
        case 'start_journey':
          result = await dispatchesAPI.startJourney(selectedDispatch.id);
          break;
        case 'weigh_in':
          result = await dispatchesAPI.weighIn(selectedDispatch.id, dataWithImages);
          break;
        case 'unload':
          result = await dispatchesAPI.unload(selectedDispatch.id, dataWithImages);
          break;
        case 'weigh_out':
          result = await dispatchesAPI.weighOut(selectedDispatch.id, dataWithImages);
          break;
        case 'complete_job':
          result = await dispatchesAPI.completeJob(selectedDispatch.id);
          break;
        default:
          throw new Error('Invalid workflow step');
      }
      
      window.alert(`${workflowStep.replace('_', ' ').toUpperCase()} completed successfully!`);
      closeWorkflowModal();
      loadOperatorData();
    } catch (error) {
      console.error('Error executing workflow step:', error);
      window.alert(`Failed to execute ${workflowStep.replace('_', ' ')}`);
    }
  };

  const updateDispatchStatus = async (dispatchId, newStatus) => {
    try {
      await dispatchesAPI.updateStatus(dispatchId, newStatus);
      
      // Show workflow notifications
      if (newStatus === 'in_transit') {
        window.alert('Dispatch started! Truck is now in transit and order is in progress.');
      } else if (newStatus === 'completed') {
        window.alert('Dispatch completed! Order is completed, stock updated, and truck returned to idle.');
      }
      
      loadOperatorData(); // Reload data
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      window.alert('Failed to update dispatch status');
    }
  };

  const logException = async () => {
    if (!selectedDispatch || !exceptionForm.description.trim()) {
      window.alert('Please provide a description for the exception');
      return;
    }

    try {
      await exceptionsAPI.create({
        dispatch: selectedDispatch.id,
        description: exceptionForm.description,
        exception_type: exceptionForm.exception_type
      });
      
      setShowExceptionModal(false);
      setExceptionForm({ description: '', exception_type: 'General' });
      setSelectedDispatch(null);
      loadOperatorData();
      window.alert('Exception logged successfully');
    } catch (error) {
      console.error('Error logging exception:', error);
      window.alert('Failed to log exception');
    }
  };

  const resolveException = async (exceptionId) => {
    try {
      await exceptionsAPI.resolve(exceptionId);
      loadOperatorData(); // Reload data
      window.alert('Exception resolved successfully');
    } catch (error) {
      console.error('Error resolving exception:', error);
      window.alert('Failed to resolve exception');
    }
  };

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

  const activeDispatches = dispatches.filter(d => d.status === 'in_progress');
  const assignedDispatches = dispatches.filter(d => d.status === 'assigned');
  const completedToday = dispatches.filter(d => 
    d.status === 'completed' && 
    new Date(d.updated_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>MineFlow Operator</h2>
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
          <h1>Operator Dashboard</h1>
          <p>Monitor and manage your assigned mining operations</p>
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
            className={`tab-button ${activeTab === 'dispatches' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatches')}
          >
            My Dispatches
          </button>
          <button 
            className={`tab-button ${activeTab === 'exceptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('exceptions')}
          >
            Exceptions
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
                  <h4>Active Dispatches</h4>
                  <span className="stat-number">{activeDispatches.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Package className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Assigned Tasks</h4>
                  <span className="stat-number">{assignedDispatches.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Completed Today</h4>
                  <span className="stat-number">{completedToday}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="stat-content">
                  <h4>Open Issues</h4>
                  <span className="stat-number">{exceptions.filter(e => !e.resolved).length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3>Start Dispatch</h3>
                <p>Begin a new dispatch operation</p>
                <button className="card-button">Start</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3>Report Issue</h3>
                <p>Log an exception or problem</p>
                <button className="card-button">Report</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  <Clock className="w-8 h-8" />
                </div>
                <h3>Check Schedule</h3>
                <p>View upcoming tasks and deadlines</p>
                <button className="card-button">Schedule</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  <Package className="w-8 h-8" />
                </div>
                <h3>Complete Task</h3>
                <p>Mark a dispatch as completed</p>
                <button className="card-button">Complete</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'dispatches' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>My Dispatches</h2>
              <p>Manage your assigned dispatch operations</p>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Dispatch ID</th>
                    <th>Truck</th>
                    <th>Order Details</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.map(dispatch => (
                    <tr key={dispatch.id}>
                      <td>#{dispatch.id}</td>
                      <td>
                        <div>
                          <strong>{dispatch.truck_number_plate}</strong>
                          <br />
                          <small>{dispatch.truck_driver}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{dispatch.order_material}</strong>
                          <br />
                          <small>{dispatch.order_quantity} tons - {dispatch.order_customer}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${dispatch.status}`}>
                          {dispatch.status}
                        </span>
                      </td>
                      <td>
                        {dispatch.status === 'assigned' && (
                          <button 
                            className="action-button start"
                            onClick={() => openWorkflowModal(dispatch, 'start_journey')}
                          >
                            Start Journey
                          </button>
                        )}
                        {dispatch.status === 'in_transit' && (
                          <button 
                            className="action-button weigh"
                            onClick={() => openWorkflowModal(dispatch, 'weigh_in')}
                          >
                            Weigh In
                          </button>
                        )}
                        {dispatch.status === 'weigh_in' && (
                          <button 
                            className="action-button unload"
                            onClick={() => openWorkflowModal(dispatch, 'unload')}
                          >
                            Unload
                          </button>
                        )}
                        {dispatch.status === 'unload' && (
                          <button 
                            className="action-button weigh"
                            onClick={() => openWorkflowModal(dispatch, 'weigh_out')}
                          >
                            Weigh Out
                          </button>
                        )}
                        {dispatch.status === 'weigh_out' && (
                          <button 
                            className="action-button complete"
                            onClick={() => openWorkflowModal(dispatch, 'complete_job')}
                          >
                            Complete Job
                          </button>
                        )}
                        {dispatch.status !== 'completed' && dispatch.status !== 'cancelled' && (
                          <button 
                            className="action-button report"
                            onClick={() => {
                              setSelectedDispatch(dispatch);
                              setShowExceptionModal(true);
                            }}
                          >
                            Report Issue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="entities-container">
            <div className="entities-header">
              <h2>Exception Logs</h2>
              <p>Track and resolve operational issues</p>
            </div>
            <div className="entities-table">
              <table>
                <thead>
                  <tr>
                    <th>Exception ID</th>
                    <th>Dispatch</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map(exception => (
                    <tr key={exception.id}>
                      <td>#{exception.id}</td>
                      <td>
                        <div>
                          <strong>Truck: {exception.dispatch_truck}</strong>
                          <br />
                          <small>Order: #{exception.dispatch_order}</small>
                        </div>
                      </td>
                      <td>{exception.exception_type}</td>
                      <td>{exception.description}</td>
                      <td>
                        <span className={`status-badge ${exception.resolved ? 'completed' : 'pending'}`}>
                          {exception.resolved ? 'Resolved' : 'Open'}
                        </span>
                      </td>
                      <td>
                        {!exception.resolved && (
                          <button 
                            className="action-button resolve"
                            onClick={() => resolveException(exception.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Workflow Modal */}
        {showWorkflowModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{workflowStep.replace('_', ' ').toUpperCase()}</h3>
                <button 
                  className="modal-close"
                  onClick={closeWorkflowModal}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Dispatch Details:</label>
                  <p><strong>Dispatch #{selectedDispatch?.id}</strong></p>
                  <p>Truck: {selectedDispatch?.truck_number_plate}</p>
                  <p>Order: {selectedDispatch?.order_material} - {selectedDispatch?.order_quantity} tons</p>
                  <p>Customer: {selectedDispatch?.order_customer}</p>
                </div>
                
                {workflowStep === 'weigh_in' && (
                  <div className="form-group">
                    <label>Gross Weight (tons):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={workflowData.gross_weight || ''}
                      onChange={(e) => setWorkflowData({...workflowData, gross_weight: parseFloat(e.target.value)})}
                      className="form-input"
                      required
                    />
                  </div>
                )}
                
                {workflowStep === 'weigh_out' && (
                  <div className="form-group">
                    <label>Tare Weight (tons):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={workflowData.tare_weight || ''}
                      onChange={(e) => setWorkflowData({...workflowData, tare_weight: parseFloat(e.target.value)})}
                      className="form-input"
                      required
                    />
                  </div>
                )}
                
                {(workflowStep === 'weigh_in' || workflowStep === 'unload' || workflowStep === 'weigh_out') && (
                  <div className="form-group">
                    <ImageUpload
                      onImagesChange={setWorkflowImages}
                      maxImages={3}
                      mediaType={workflowStep}
                      description={`Upload proof images for ${workflowStep.replace('_', ' ')}`}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  className="action-button cancel"
                  onClick={closeWorkflowModal}
                >
                  Cancel
                </button>
                <button 
                  className="action-button submit"
                  onClick={executeWorkflowStep}
                  disabled={
                    (workflowStep === 'weigh_in' && !workflowData.gross_weight) ||
                    (workflowStep === 'weigh_out' && !workflowData.tare_weight)
                  }
                >
                  {workflowStep === 'start_journey' && 'Start Journey'}
                  {workflowStep === 'weigh_in' && 'Record Weigh In'}
                  {workflowStep === 'unload' && 'Confirm Unload'}
                  {workflowStep === 'weigh_out' && 'Record Weigh Out'}
                  {workflowStep === 'complete_job' && 'Complete Job'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exception Modal */}
        {showExceptionModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Log Exception</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowExceptionModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Dispatch:</label>
                  <p>Dispatch #{selectedDispatch?.id} - {selectedDispatch?.truck_number_plate}</p>
                </div>
                <div className="form-group">
                  <label>Exception Type:</label>
                  <select 
                    value={exceptionForm.exception_type}
                    onChange={(e) => setExceptionForm({...exceptionForm, exception_type: e.target.value})}
                    className="form-input"
                  >
                    <option value="General">General</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Safety">Safety</option>
                    <option value="Delay">Delay</option>
                    <option value="Quality">Quality</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description:</label>
                  <textarea 
                    value={exceptionForm.description}
                    onChange={(e) => setExceptionForm({...exceptionForm, description: e.target.value})}
                    className="form-input"
                    rows="4"
                    placeholder="Describe the issue in detail..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="action-button cancel"
                  onClick={() => setShowExceptionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="action-button submit"
                  onClick={logException}
                >
                  Log Exception
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;
