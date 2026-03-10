
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { Alert, AlertSeverity, AlertStatus } from '../../types';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

export const AlertCenter: React.FC = () => {
  const { 
    alerts, 
    markAlertRead, 
    markAllRead, 
    dismissAlert, 
    clearDismissed,
    loadMoreAlerts,
    setSearchTerm
  } = useCosmicStore();
  
  const navigate = useNavigate();
  
  // Default to UNREAD so handled items disappear from the main view (Inbox zero approach)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CRITICAL'>('UNREAD');

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
      if (alert.status === 'DISMISSED') return false;
      if (filter === 'UNREAD') return alert.status === 'UNREAD';
      if (filter === 'CRITICAL') return alert.severity === 'CRITICAL';
      return true;
  });

  // Time Grouping
  const groupedAlerts = {
      today: filteredAlerts.filter(a => isToday(a.timestamp)),
      yesterday: filteredAlerts.filter(a => isYesterday(a.timestamp)),
      week: filteredAlerts.filter(a => isThisWeek(a.timestamp) && !isToday(a.timestamp) && !isYesterday(a.timestamp)),
      earlier: filteredAlerts.filter(a => !isThisWeek(a.timestamp))
  };

  const handleCardClick = (alert: Alert) => {
      // Navigate to Dashboard with context
      setSearchTerm(alert.asteroidId);
      markAlertRead(alert.id);
      navigate('/dashboard'); 
  };

  const hasUnread = alerts.some(a => a.status === 'UNREAD');

  return (
    <div className="max-w-5xl mx-auto min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">ALERT CENTER</h1>
            <p className="text-gray-400 font-sans">Strategic intelligence and orbital threat notifications.</p>
        </div>
        
        <div className="flex gap-4">
            {hasUnread && (
                <Button size="sm" variant="ghost" onClick={markAllRead}>
                    Mark All Read
                </Button>
            )}
            <Button size="sm" variant="void" onClick={() => { if(confirm('Clear all dismissed history?')) clearDismissed(); }}>
                Clear History
            </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/5 mb-8">
          {['UNREAD', 'ALL', 'CRITICAL'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`pb-4 text-sm font-mono tracking-widest relative transition-colors ${filter === tab ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  {tab}
                  {filter === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-electric shadow-[0_0_10px_#00F0FF]"
                      />
                  )}
              </button>
          ))}
      </div>

      {/* Timeline */}
      <div className="space-y-12">
          {filteredAlerts.length === 0 ? (
              <EmptyState filter={filter} onSwitchToAll={() => setFilter('ALL')} />
          ) : (
              <>
                <TimeSection title="Today" alerts={groupedAlerts.today} onRead={markAlertRead} onDismiss={dismissAlert} onClick={handleCardClick} />
                <TimeSection title="Yesterday" alerts={groupedAlerts.yesterday} onRead={markAlertRead} onDismiss={dismissAlert} onClick={handleCardClick} />
                <TimeSection title="This Week" alerts={groupedAlerts.week} onRead={markAlertRead} onDismiss={dismissAlert} onClick={handleCardClick} />
                <TimeSection title="Earlier" alerts={groupedAlerts.earlier} onRead={markAlertRead} onDismiss={dismissAlert} onClick={handleCardClick} />
                
                {filter !== 'UNREAD' && (
                    <div className="flex justify-center pt-8">
                        <Button variant="ghost" onClick={loadMoreAlerts}>Load Archived Signals</Button>
                    </div>
                )}
              </>
          )}
      </div>
    </div>
  );
};

const TimeSection: React.FC<{ 
    title: string; 
    alerts: Alert[]; 
    onRead: (id: string) => void;
    onDismiss: (id: string) => void;
    onClick: (alert: Alert) => void;
}> = ({ title, alerts, onRead, onDismiss, onClick }) => {
    if (alerts.length === 0) return null;

    return (
        <section>
            <h3 className="text-xs font-mono uppercase text-gray-600 mb-6 tracking-widest">{title}</h3>
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} onRead={onRead} onDismiss={onDismiss} onClick={onClick} />
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};

const AlertCard: React.FC<{
    alert: Alert;
    onRead: (id: string) => void;
    onDismiss: (id: string) => void;
    onClick: (alert: Alert) => void;
}> = ({ alert, onRead, onDismiss, onClick }) => {
    const isUnread = alert.status === 'UNREAD';
    const isDismissed = alert.status === 'DISMISSED'; // Though dismissed usually hidden, styled just in case
    
    const severityColors = {
        CRITICAL: 'border-l-molten shadow-[inset_10px_0_20px_-10px_rgba(255,61,0,0.1)]',
        ELEVATED: 'border-l-orange-400 shadow-[inset_10px_0_20px_-10px_rgba(251,146,60,0.1)]',
        MODERATE: 'border-l-yellow-400',
        LOW: 'border-l-electric'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isDismissed ? 0.5 : 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            whileHover={{ scale: 1.005, backgroundColor: 'rgba(26, 35, 60, 0.6)' }}
            onClick={() => onClick(alert)}
            className={`
                relative bg-void-900/40 backdrop-blur-md border border-white/5 rounded-r-lg border-l-4 p-5 cursor-pointer group transition-all duration-300
                ${severityColors[alert.severity]}
                ${isUnread ? 'bg-void-900/80 shadow-lg' : 'opacity-60 grayscale-[0.3] hover:grayscale-0 hover:opacity-90'}
            `}
        >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                
                {/* Content */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                        <h4 className="text-lg font-display font-bold text-white group-hover:text-electric transition-colors">
                            {alert.asteroidName}
                        </h4>
                        <Badge 
                            label={alert.severity} 
                            type={alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'ELEVATED' ? 'warning' : 'electric'} 
                        />
                        {isUnread && <span className="w-2 h-2 rounded-full bg-electric animate-pulse shadow-[0_0_8px_#00F0FF]" />}
                    </div>
                    
                    <p className={`text-sm ${isUnread ? 'text-gray-200' : 'text-gray-500'}`}>
                        {alert.message}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-3">
                        <MetadataItem icon="📅" label="Approach" value={alert.metadata.approachDate} />
                        <MetadataItem icon="📏" label="Miss Dist" value={alert.metadata.missDistance} />
                        <MetadataItem icon="⚠" label="Risk Score" value={alert.metadata.riskScore.toString()} />
                    </div>
                </div>

                {/* Meta & Actions */}
                <div className="flex flex-col items-end gap-4 min-w-[120px]">
                    <span className="text-[10px] font-mono text-gray-600">
                        {format(alert.timestamp, 'HH:mm')} UTC
                    </span>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {isUnread && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); onRead(alert.id); }}
                                className="p-2 hover:bg-white/10 rounded-full text-electric transition-colors"
                                title="Mark as Read"
                             >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             </button>
                         )}
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                            className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-molten transition-colors"
                            title="Dismiss / Archive"
                         >
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MetadataItem: React.FC<{ icon: string, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-void-950/50 px-2 py-1 rounded border border-white/5">
        <span>{icon}</span>
        <span className="text-gray-400 uppercase tracking-wide">{label}:</span>
        <span className="text-white">{value}</span>
    </div>
);

const EmptyState: React.FC<{ filter: string, onSwitchToAll: () => void }> = ({ filter, onSwitchToAll }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <div className="w-24 h-24 bg-void-900 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-700">
                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {filter === 'CRITICAL' 
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    }
                </svg>
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
                {filter === 'CRITICAL' ? "SECTOR SECURE" : filter === 'UNREAD' ? "ALL CAUGHT UP" : "NO ALERTS DETECTED"}
            </h3>
            <p className="text-gray-500 max-w-sm mb-4">
                {filter === 'CRITICAL' 
                    ? "No critical threats currently identified in your surveillance sector."
                    : filter === 'UNREAD' 
                        ? "You have no new messages. Check history for past logs." 
                        : "Telemetry analysis suggests orbital paths are nominal."
                }
            </p>
            {filter === 'UNREAD' && (
                <Button variant="ghost" size="sm" onClick={onSwitchToAll}>View Read History</Button>
            )}
        </div>
    );
};
