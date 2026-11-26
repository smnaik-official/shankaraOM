import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  FileText,
  Repeat,
  Clock,
  ArrowRight,
  CheckCheck,
  X,
  Sparkles,
  Zap,
  Send,
  CalendarCheck,
  LogOut,
  Database,
} from 'lucide-react';
import { logoutUser } from '../utils/auth';
import { checkDatabaseHealth, DatabaseStatus, initializeCloudSync } from '../services/api';
import {
  AlertNotification,
  getActiveNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../data/notifications';
import { formatDateDMY } from '../utils/date';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'INVOICE_DUE' | 'SUBSCRIPTION_DUE' | 'PAYMENT_DUE' | 'PROPOSAL_FOLLOWUP' | 'COMPLIANCE_DUE'>('ALL');
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Monitor MongoDB connection health
  useEffect(() => {
    checkDatabaseHealth().then(setDbStatus);
    const interval = setInterval(() => {
      checkDatabaseHealth().then(setDbStatus);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Load and refresh notifications
  const reloadNotifications = () => {
    setNotifications(getActiveNotifications());
  };

  useEffect(() => {
    reloadNotifications();

    const handleNotificationsChanged = () => {
      reloadNotifications();
    };

    window.addEventListener('notifications-changed', handleNotificationsChanged);
    window.addEventListener('storage', handleNotificationsChanged);

    return () => {
      window.removeEventListener('notifications-changed', handleNotificationsChanged);
      window.removeEventListener('storage', handleNotificationsChanged);
    };
  }, []);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const invoiceCount = notifications.filter((n) => n.type === 'INVOICE_DUE').length;
  const subscriptionCount = notifications.filter((n) => n.type === 'SUBSCRIPTION_DUE').length;
  const paymentCount = notifications.filter((n) => n.type === 'PAYMENT_DUE').length;
  const proposalCount = notifications.filter((n) => n.type === 'PROPOSAL_FOLLOWUP').length;
  const complianceCount = notifications.filter((n) => n.type === 'COMPLIANCE_DUE').length;

  const handleNotificationClick = (notif: AlertNotification) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);
    navigate(notif.targetUrl);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(notifications.map((n) => n.id));
  };

  const getTypeIcon = (type: AlertNotification['type']) => {
    switch (type) {
      case 'INVOICE_DUE':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        );
      case 'SUBSCRIPTION_DUE':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Repeat className="w-4 h-4" />
          </div>
        );
      case 'PAYMENT_DUE':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'PROPOSAL_FOLLOWUP':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Send className="w-4 h-4" />
          </div>
        );
      case 'COMPLIANCE_DUE':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: AlertNotification['type']) => {
    switch (type) {
      case 'INVOICE_DUE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SUBSCRIPTION_DUE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PAYMENT_DUE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PROPOSAL_FOLLOWUP':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'COMPLIANCE_DUE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 relative z-30">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-semibold text-gray-800">
          Welcome back, Manjunath
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* MongoDB Cloud Live Status */}
        <div
          onClick={() => {
            checkDatabaseHealth().then((s) => {
              setDbStatus(s);
              if (s.connected) initializeCloudSync();
            });
          }}
          className={`cursor-pointer select-none hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-2xs transition-all ${
            dbStatus?.connected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title={
            dbStatus?.connected
              ? `Connected to MongoDB Atlas: ${dbStatus.cluster}\nDatabase: ${dbStatus.database} (${dbStatus.pingMs}ms)\nClick to re-verify cloud sync.`
              : 'Backend server is unreachable / Local Cache Active.\nClick to re-try connection.'
          }
        >
          <span className="relative flex h-2 w-2">
            {dbStatus?.connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </span>
          <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="font-semibold">{dbStatus?.connected ? 'MongoDB Cloud' : 'Cloud Sync'}</span>
          {dbStatus?.pingMs !== undefined && dbStatus.connected && (
            <span className="text-[10px] text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded font-mono">
              {dbStatus.pingMs}ms
            </span>
          )}
        </div>

        {/* Notification Bell Button & Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`p-2 rounded-full transition-colors relative ${
              isOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Action Alerts & Due Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-[96vw] sm:w-[720px] md:w-[760px] lg:w-[780px] max-w-[800px] bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-50 animate-fade-in flex flex-col max-h-[85vh]">
              {/* Popover Header */}
              <div className="px-6 py-4 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-bold text-gray-900 leading-tight">
                      Alerts & Reminders
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {unreadCount} actionable task{unreadCount !== 1 ? 's' : ''} require attention
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Pills - Wide, No Scrollbar */}
              <div className="px-5 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-wrap sm:flex-nowrap text-xs">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('INVOICE_DUE')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === 'INVOICE_DUE'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoices ({invoiceCount})</span>
                </button>
                <button
                  onClick={() => setFilter('SUBSCRIPTION_DUE')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === 'SUBSCRIPTION_DUE'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Subscriptions ({subscriptionCount})</span>
                </button>
                <button
                  onClick={() => setFilter('PAYMENT_DUE')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === 'PAYMENT_DUE'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Payments ({paymentCount})</span>
                </button>
                <button
                  onClick={() => setFilter('PROPOSAL_FOLLOWUP')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === 'PROPOSAL_FOLLOWUP'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Quotes ({proposalCount})</span>
                </button>
                <button
                  onClick={() => setFilter('COMPLIANCE_DUE')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === 'COMPLIANCE_DUE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Compliance ({complianceCount})</span>
                </button>
              </div>

              {/* Scrollable Notifications List with sleek scrollbar */}
              <div className="overflow-y-auto divide-y divide-gray-100 flex-1 max-h-[480px] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-250 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {filteredNotifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">All caught up!</p>
                    <p className="text-xs text-gray-500 mt-1">
                      No pending alerts or due actions in this category.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 hover:bg-indigo-50/40 transition-colors cursor-pointer group flex items-start gap-3.5 relative ${
                        !notif.isRead ? 'bg-indigo-50/25' : 'bg-white'
                      }`}
                    >
                      {/* Left Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${getTypeBadge(
                              notif.type
                            )}`}
                          >
                            {notif.badgeText}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold">
                            {formatDateDMY(notif.dueDate)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mt-1.5">
                          {notif.title}
                        </h4>

                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                            <span>{notif.targetLabel}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </span>

                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" title="Unread alert"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Quick Link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
          title="My Profile & Billing Settings"
        >
          <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
            Billing Profile
          </span>
          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
            <User className="w-4 h-4" />
          </div>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={() => {
            logoutUser();
            navigate('/login');
          }}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors border border-gray-200 hover:border-rose-200 text-xs font-semibold shadow-2xs"
          title="Sign Out of Admin Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
