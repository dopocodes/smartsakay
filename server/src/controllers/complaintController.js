const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');


const createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({ ...req.body, userId: req.user._id });
    return apiResponse.success(res, complaint, 'Complaint submitted successfully', 201);
  } catch (error) { next(error); }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter).populate('routeId', 'name')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, complaints, total, page, limit);
  } catch (error) { next(error); }
};

const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('routeId', 'name')
      .populate('resolvedBy', 'firstName lastName');
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);
    if (req.user.role === 'commuter' && complaint.userId._id.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized', 403);
    }
    return apiResponse.success(res, complaint);
  } catch (error) { next(error); }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('userId', 'firstName lastName email').populate('routeId', 'name')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, complaints, total, page, limit);
  } catch (error) { next(error); }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === 'resolved' || status === 'dismissed') {
      updates.resolvedBy = req.user._id;
      updates.resolvedAt = new Date();
    }
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);
    await Notification.create({
      userId: complaint.userId, title: 'Complaint Update',
      message: `Your complaint "${complaint.subject}" has been updated to: ${status.replace('_', ' ')}`,
      type: 'complaint_update', metadata: { complaintId: complaint._id },
    });

    await logAuditEvent(req, {
      action: 'COMPLAINT_STATUS_UPDATE',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, newStatus: status },
    });

    return apiResponse.success(res, complaint, 'Complaint status updated');
  } catch (error) { next(error); }
};

const addAdminNotes = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { adminNotes }, { new: true });
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    await logAuditEvent(req, {
      action: 'COMPLAINT_NOTE_ADDED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, notes: adminNotes },
    });

    return apiResponse.success(res, complaint, 'Admin notes added');

  } catch (error) { next(error); }
};

module.exports = { createComplaint, getMyComplaints, getComplaintById, getAllComplaints, updateComplaintStatus, addAdminNotes };
