import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Filter, 
  MessageSquare, 
  MapPin, 
  Car, 
  X, 
  Check 
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const ComplaintsPage = () => {
  const { showSuccess, showError } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints');
      setComplaints(data.data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminNotes(complaint.adminNotes || '');
    setMessage(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      if (newStatus !== selectedComplaint.status) {
        await api.put(`/complaints/${selectedComplaint._id}/status`, { status: newStatus });
      }
      if (adminNotes !== selectedComplaint.adminNotes) {
        await api.put(`/complaints/${selectedComplaint._id}/notes`, { notes: adminNotes });
      }
      showSuccess(
        'Complaint Updated',
        `Case ticket marked as "${newStatus.replace('_', ' ')}". Status saved.`
      );
      setMessage({ type: 'success', text: 'Complaint status and admin notes updated.' });
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to update complaint.';
      showError('Update Failed', errText);
      setMessage({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">● Pending</span>;
      case 'under_review':
        return <span className="badge badge-info">● Under Review</span>;
      case 'resolved':
        return <span className="badge badge-success">● Resolved</span>;
      case 'dismissed':
        return <span className="badge badge-danger">● Dismissed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', marginBottom: '4px' }}>Commuter Complaints & Grievances</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Investigate reported PUV overcharging, safety violations, and misconduct in Dagupan City.
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '13px',
        }}>
          {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        <select
          className="form-select"
          style={{ maxWidth: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          className="form-select"
          style={{ maxWidth: '220px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="overcharging">Overcharging</option>
          <option value="reckless_driving">Reckless Driving</option>
          <option value="harassment">Harassment</option>
          <option value="route_deviation">Route Deviation</option>
          <option value="vehicle_condition">Vehicle Condition</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Complaints Table */}
      <div className="card">
        {filteredComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            No commuter complaints matching current filters.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Plate #</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span style={{ 
                        textTransform: 'capitalize', 
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--primary-light)'
                      }}>
                        {c.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#ffffff' }}>
                      {c.subject}
                    </td>
                    <td>
                      {c.plateNumber ? (
                        <span style={{ 
                          fontFamily: 'monospace', 
                          background: 'rgba(255,255,255,0.06)', 
                          padding: '3px 6px', 
                          borderRadius: '4px',
                          color: '#f1f5f9'
                        }}>
                          {c.plateNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>None</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {c.userId?.firstName ? `${c.userId.firstName} ${c.userId.lastName}` : 'Commuter'}
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Review Modal */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '18px' }}>
                  {selectedComplaint.subject}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--primary-light)' }}>
                  Category: {selectedComplaint.category?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'transparent', color: 'var(--text-dim)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateComplaint}>
              <div className="modal-body">
                {/* Description Box */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Commuter Statement
                  </div>
                  <p style={{ fontSize: '14px', color: '#ffffff', lineHeight: '1.6' }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {/* Metadata Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Car size={14} />
                      <span>Vehicle Details</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'white', marginTop: '4px' }}>
                      {selectedComplaint.plateNumber ? `Plate: ${selectedComplaint.plateNumber}` : 'Plate not specified'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Clock size={14} />
                      <span>Filed Date</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'white', marginTop: '4px' }}>
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="form-group">
                  <label className="form-label">Update Complaint Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Administrator Notes</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Enter internal resolution notes, actions taken, or LTFRB endorsement details..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving Changes...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
