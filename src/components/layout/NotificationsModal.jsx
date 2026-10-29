import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock3, FileText, Info, X } from 'lucide-react';
import { getApplications } from '../../api/applications.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NotificationsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Generate real relevant application event notifications based on current applications
    getApplications()
      .then((apps) => {
        const events = [];
        apps.forEach((app) => {
          const appId = `APP-2026-000${app.id}`;
          const inst = app.institution_name || app.institution || 'Institution';
          const isOfficial = user?.role === 'aicte_official';

          if (app.status === 'submitted') {
            events.push({
              id: `${app.id}-sub`,
              type: 'submission',
              title: isOfficial ? 'New Application Received' : 'Application Submitted',
              message: isOfficial
                ? `${inst} submitted ${appId} for approval screening.`
                : `Your application ${appId} was successfully submitted for AICTE review.`,
              time: 'Recent',
              icon: FileText,
              color: '#2563eb',
            });
          } else if (app.status === 'approved') {
            events.push({
              id: `${app.id}-appr`,
              type: 'decision',
              title: 'Application Approved',
              message: isOfficial
                ? `You approved application ${appId} for ${inst}.`
                : `Congratulations! AICTE has approved your application ${appId}.`,
              time: 'Recent',
              icon: CheckCircle2,
              color: '#10b981',
            });
          } else if (app.status === 'rejected') {
            events.push({
              id: `${app.id}-rej`,
              type: 'decision',
              title: 'Application Rejected / Action Required',
              message: isOfficial
                ? `Decision recorded: ${appId} for ${inst} was rejected.`
                : `AICTE has rejected or requested changes for ${appId}. Check notes in Application Details.`,
              time: 'Recent',
              icon: Info,
              color: '#ef4444',
            });
          } else if (app.status === 'under_review') {
            events.push({
              id: `${app.id}-rev`,
              type: 'review',
              title: 'Under AICTE Review',
              message: isOfficial
                ? `${appId} is currently under evaluation.`
                : `AICTE officials have commenced technical verification on ${appId}.`,
              time: 'In progress',
              icon: Clock3,
              color: '#f59e0b',
            });
          }
        });

        if (events.length === 0) {
          events.push({
            id: 'demo-welcome',
            type: 'system',
            title: 'Workspace Active',
            message: 'All application notifications and official AICTE decisions will appear here.',
            time: 'Just now',
            icon: Bell,
            color: '#64748b',
          });
        }
        setNotifications(events);
      })
      .catch(() => {});
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} className="text-blue" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Application Events</h3>
          </div>
          <button type="button" className="notif-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="notification-events-list">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="notification-event-item">
                <div className="notif-icon-circle" style={{ color: n.color, backgroundColor: `${n.color}15` }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{n.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '4px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
