import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import apiService from '@services/api';
import type { AuditLog, SecurityEvent, Pagination } from '../types';

type Tab = 'stats' | 'events' | 'logs' | 'failed';

interface StatsData {
  period: string;
  since: string;
  security: {
    eventsByType: Array<{ type: string; count: string }>;
    eventsBySeverity: Array<{ severity: string; count: string }>;
    unresolvedEvents: number;
    failedLogins: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
  };
}

interface EventsResponse {
  events: SecurityEvent[];
  pagination: Pagination;
}

interface LogsResponse {
  logs: AuditLog[];
  pagination: Pagination;
}

interface FailedLoginsResponse {
  failedLogins: AuditLog[];
  summary: { total: number; byIp: Record<string, number>; since: string };
}

const severityColor: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const Monitoring = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<StatsData | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [eventsPagination, setEventsPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsPagination, setLogsPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [failedLogins, setFailedLogins] = useState<FailedLoginsResponse | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const response = await apiService.get<StatsData>('/admin/stats?hours=24');
    if (response.success && 'data' in response) {
      setStats(response.data);
    } else if ('error' in response) {
      setError(response.error.message);
    }
    setIsLoading(false);
  }, []);

  const fetchEvents = useCallback(async (page = 1) => {
    setIsLoading(true);
    const response = await apiService.get<EventsResponse>(
      `/admin/security-events?page=${page}&limit=20`
    );
    if (response.success && 'data' in response) {
      setEvents(response.data.events);
      setEventsPagination(response.data.pagination);
    } else if ('error' in response) {
      setError(response.error.message);
    }
    setIsLoading(false);
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    const response = await apiService.get<LogsResponse>(`/admin/logs?page=${page}&limit=20`);
    if (response.success && 'data' in response) {
      setLogs(response.data.logs);
      setLogsPagination(response.data.pagination);
    } else if ('error' in response) {
      setError(response.error.message);
    }
    setIsLoading(false);
  }, []);

  const fetchFailedLogins = useCallback(async () => {
    setIsLoading(true);
    const response = await apiService.get<FailedLoginsResponse>('/admin/failed-logins?hours=24');
    if (response.success && 'data' in response) {
      setFailedLogins(response.data);
    } else if ('error' in response) {
      setError(response.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setError('');
    if (activeTab === 'stats') fetchStats();
    else if (activeTab === 'events') fetchEvents();
    else if (activeTab === 'logs') fetchLogs();
    else if (activeTab === 'failed') fetchFailedLogins();
  }, [activeTab, fetchStats, fetchEvents, fetchLogs, fetchFailedLogins]);

  const handleResolveEvent = async (id: string) => {
    const response = await apiService.patch<SecurityEvent>(`/admin/security-events/${id}/resolve`);
    if (response.success) {
      fetchEvents(eventsPagination.page);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: 'Overview' },
    { key: 'events', label: 'Security Events' },
    { key: 'logs', label: 'Audit Logs' },
    { key: 'failed', label: 'Failed Logins' },
  ];

  const renderPagination = (pag: Pagination, onPageChange: (p: number) => void) => {
    if (pag.pages <= 1) return null;
    return (
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: Math.min(pag.pages, 10) }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded text-sm ${p === pag.page ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
          >
            {p}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">SafeConnect Solutions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/documents" className="text-gray-700 hover:text-primary-600">
                Documents
              </Link>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">Security Monitoring</h2>

          <div className="flex space-x-1 mb-6 bg-white rounded-lg shadow p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Stats Tab */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                      <p className="text-3xl font-bold text-primary-600">{stats.users.total}</p>
                      <p className="text-sm text-gray-600">Total Users</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-3xl font-bold text-green-600">{stats.users.active}</p>
                      <p className="text-sm text-gray-600">Active Users</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.security.failedLogins}
                      </p>
                      <p className="text-sm text-gray-600">Failed Logins (24h)</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {stats.security.unresolvedEvents}
                      </p>
                      <p className="text-sm text-gray-600">Unresolved Events</p>
                    </div>
                  </div>

                  {stats.security.eventsByType.length > 0 && (
                    <div className="card">
                      <h3 className="font-bold mb-3">Events by Type ({stats.period})</h3>
                      <div className="space-y-2">
                        {stats.security.eventsByType.map((item) => (
                          <div key={item.type} className="flex justify-between items-center py-1">
                            <span className="text-sm text-gray-700">
                              {item.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.security.eventsBySeverity.length > 0 && (
                    <div className="card">
                      <h3 className="font-bold mb-3">Events by Severity ({stats.period})</h3>
                      <div className="flex space-x-4">
                        {stats.security.eventsBySeverity.map((item) => (
                          <span
                            key={item.severity}
                            className={`px-3 py-1 rounded text-sm font-medium ${severityColor[item.severity] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {item.severity}: {item.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.security.eventsByType.length === 0 &&
                    stats.security.eventsBySeverity.length === 0 && (
                      <div className="card text-center py-6">
                        <p className="text-gray-600">No security events in the last 24 hours.</p>
                      </div>
                    )}
                </div>
              )}

              {/* Security Events Tab */}
              {activeTab === 'events' && (
                <div>
                  {events.length === 0 ? (
                    <div className="card text-center py-6">
                      <p className="text-gray-600">No security events recorded.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div key={event.id} className="card">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-medium ${severityColor[event.severity]}`}
                                  >
                                    {event.severity}
                                  </span>
                                  <span className="text-sm font-semibold">
                                    {event.type.replace(/_/g, ' ')}
                                  </span>
                                  {event.resolved && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      Resolved
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  IP: {event.ip} - {new Date(event.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!event.resolved && (
                                <button
                                  onClick={() => handleResolveEvent(event.id)}
                                  className="btn btn-secondary text-sm ml-4"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {renderPagination(eventsPagination, fetchEvents)}
                    </>
                  )}
                </div>
              )}

              {/* Audit Logs Tab */}
              {activeTab === 'logs' && (
                <div>
                  {logs.length === 0 ? (
                    <div className="card text-center py-6">
                      <p className="text-gray-600">No audit logs recorded.</p>
                    </div>
                  ) : (
                    <>
                      <div className="card overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="pb-2 font-semibold">Action</th>
                              <th className="pb-2 font-semibold">User</th>
                              <th className="pb-2 font-semibold">IP</th>
                              <th className="pb-2 font-semibold">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log) => (
                              <tr key={log.id} className="border-b last:border-b-0">
                                <td className="py-2">{log.action.replace(/_/g, ' ')}</td>
                                <td className="py-2 text-gray-600">
                                  {log.user
                                    ? `${log.user.firstName} ${log.user.lastName}`
                                    : log.userId || '-'}
                                </td>
                                <td className="py-2 text-gray-500 font-mono text-xs">{log.ip}</td>
                                <td className="py-2 text-gray-500">
                                  {new Date(log.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPagination(logsPagination, fetchLogs)}
                    </>
                  )}
                </div>
              )}

              {/* Failed Logins Tab */}
              {activeTab === 'failed' && failedLogins && (
                <div className="space-y-4">
                  <div className="card">
                    <h3 className="font-bold mb-3">Summary (Last 24 hours)</h3>
                    <p className="text-sm text-gray-600">
                      Total failed attempts:{' '}
                      <span className="font-semibold">{failedLogins.summary.total}</span>
                    </p>
                    {Object.keys(failedLogins.summary.byIp).length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">By IP Address:</p>
                        <div className="space-y-1">
                          {Object.entries(failedLogins.summary.byIp).map(([ip, count]) => (
                            <div key={ip} className="flex justify-between text-sm">
                              <span className="font-mono text-gray-600">{ip}</span>
                              <span
                                className={`font-semibold ${count >= 5 ? 'text-red-600' : 'text-gray-900'}`}
                              >
                                {count} attempts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {failedLogins.failedLogins.length > 0 && (
                    <div className="card overflow-x-auto">
                      <h3 className="font-bold mb-3">Recent Failed Attempts</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="pb-2 font-semibold">IP</th>
                            <th className="pb-2 font-semibold">Details</th>
                            <th className="pb-2 font-semibold">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failedLogins.failedLogins.map((log) => (
                            <tr key={log.id} className="border-b last:border-b-0">
                              <td className="py-2 font-mono text-xs">{log.ip}</td>
                              <td className="py-2 text-gray-600">
                                {typeof log.details === 'object' && log.details
                                  ? JSON.stringify(log.details)
                                  : String(log.details || '-')}
                              </td>
                              <td className="py-2 text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {failedLogins.summary.total === 0 && (
                    <div className="card text-center py-6">
                      <p className="text-gray-600">
                        No failed login attempts in the last 24 hours.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Monitoring;
