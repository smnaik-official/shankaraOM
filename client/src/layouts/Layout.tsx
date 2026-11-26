import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const Layout: React.FC = () => {
  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
