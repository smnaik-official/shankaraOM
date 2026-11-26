import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Send,
  Users,
  IndianRupee,
  Briefcase,
  Megaphone,
  PieChart,
  ScrollText,
  CalendarClock,
  TrendingUp,
  CalendarCheck,
  LogOut,
} from 'lucide-react';
import { logoutUser } from '../utils/auth';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', path: '/invoices', icon: FileText },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Prospects', path: '/prospects', icon: Send },
  { name: 'Quotations', path: '/quotations', icon: ScrollText },
  { name: 'Employees', path: '/employees', icon: Briefcase },
  { name: 'Expenses', path: '/expenses', icon: IndianRupee },
  { name: 'Ad Ledger', path: '/ad-ledger', icon: Megaphone },
  { name: 'Subscriptions', path: '/subscriptions', icon: CalendarClock },
  { name: 'Compliance', path: '/compliance', icon: CalendarCheck },
  { name: 'Profitability', path: '/client-profitability', icon: TrendingUp },
  { name: 'Reports', path: '/reports', icon: PieChart },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-2 max-w-full">
          <img
            src="/shankara-logo.png"
            alt="Shankara Online Solutions"
            className="h-9 w-auto max-w-[210px] object-contain"
          />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Profile Quick Link & Logout */}
      <div className="p-3 border-t border-gray-200 flex items-center justify-between gap-1">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left group flex-1 min-w-0"
          title="Manage Billing Profile & Settings"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
            MN
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600">
              Manjunath Naik S
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              Shankara Online Solutions
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
          title="Sign Out of Admin Portal"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
