import { useAuth } from '@context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">SafeConnect Solutions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/documents" className="text-gray-700 hover:text-primary-600">
                Documents
              </Link>
              {user?.role === 'admin' && (
                <Link to="/monitoring" className="text-gray-700 hover:text-primary-600">
                  Monitoring
                </Link>
              )}
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user?.firstName}!</h2>
            <p className="text-gray-600 mb-4">
              You are logged in as <span className="font-semibold">{user?.role}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Link to="/documents" className="card hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-lg mb-2">Documents</h3>
                <p className="text-gray-600">Manage your secure documents</p>
              </Link>

              {user?.role === 'admin' && (
                <Link to="/monitoring" className="card hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-lg mb-2">Security Monitoring</h3>
                  <p className="text-gray-600">View security logs and events</p>
                </Link>
              )}

              <div className="card bg-primary-50">
                <h3 className="font-bold text-lg mb-2 text-primary-900">Account Info</h3>
                <p className="text-sm text-primary-800">Email: {user?.email}</p>
                <p className="text-sm text-primary-800">Role: {user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
