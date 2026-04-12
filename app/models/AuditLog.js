import mongoose, { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema({
    adminEmail: { type: String, required: true },
    actionType: { type: String, required: true }, // e.g., 'CREATE_EXAM', 'DELETE_QUESTION'
    resourceId: { type: String, required: true }, // The ID of the exam/question affected
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
});

const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);

export default AuditLog;
