import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import PriorityView from './components/PriorityView';
import TodayFollowUpsView from './components/TodayFollowUpsView';
import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import ApplicationModal from './components/ApplicationModal';
import UserModal from './components/UserModal';
import FollowUpGeneratorModal from './components/FollowUpGeneratorModal';
import SnoozeConfirmModal from './components/SnoozeConfirmModal';
import ApplicationDetailModal from './components/ApplicationDetailModal';
import { 
  Search, Filter, CheckCircle2, AlertTriangle, ArrowUpDown
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [selectedUserId] = useState('u1'); // Fixed user u1 Maya
  const [nowParam, setNowParam] = useState('2026-10-03T16:00:00Z');
  
  const [applications, setApplications] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [priorityRankings, setPriorityRankings] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [activeTab, setActiveTab] = useState('priority');

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetApp, setFollowUpTargetApp] = useState(null);

  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [snoozeTargetApp, setSnoozeTargetApp] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailApp, setSelectedDetailApp] = useState(null);

  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-User-Id': selectedUserId
    };
  }, [selectedUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const url = `/api/applications?now=${encodeURIComponent(nowParam)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  }, [nowParam, getHeaders]);

  const fetchTodayFollowUps = useCallback(async () => {
    try {
      const url = `/follow-ups?now=${encodeURIComponent(nowParam)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTodayFollowUps(data);
      }
    } catch (err) {
      console.error('Failed to fetch today follow-ups:', err);
    }
  }, [nowParam, getHeaders]);

  const fetchPriorityRankings = useCallback(async () => {
    try {
      const url = `/follow-ups/priority?now=${encodeURIComponent(nowParam)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPriorityRankings(data);
      }
    } catch (err) {
      console.error('Failed to fetch priority rankings:', err);
    }
  }, [nowParam, getHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const url = `/api/stats?now=${encodeURIComponent(nowParam)}`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [nowParam, getHeaders]);

  const refreshAllData = useCallback(() => {
    fetchApplications();
    fetchTodayFollowUps();
    fetchPriorityRankings();
    fetchStats();
  }, [fetchApplications, fetchTodayFollowUps, fetchPriorityRankings, fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const handleStatusChange = async (appId, newStatus) => {
    const previousApps = [...applications];
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      showToast(`Status updated to ${newStatus}`);
      refreshAllData();
    } catch (err) {
      console.error(err);
      setApplications(previousApps);
      showToast(err.message || 'Failed to update status', true);
    }
  };

  const handleSaveApplication = async (appData) => {
    const isEdit = !!appData.id;
    const url = isEdit ? `/api/applications/${appData.id}` : '/api/applications';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(appData)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save application');
      }

      showToast(isEdit ? 'Application updated successfully' : 'New application added successfully');
      refreshAllData();
    } catch (err) {
      console.error(err);
      showToast(err.message, true);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    const previousApps = [...applications];
    setApplications(prev => prev.filter(a => a.id !== appId));

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to delete application');
      }

      showToast('Application deleted');
      refreshAllData();
    } catch (err) {
      console.error(err);
      setApplications(previousApps);
      showToast(err.message || 'Failed to delete application', true);
    }
  };

  const processedApplications = useMemo(() => {
    let result = [...applications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        app =>
          app.company.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q) ||
          (app.notes && app.notes.toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter(app => app.status === selectedStatus);
    }

    if (sortBy === 'company') {
      result.sort((a, b) => a.company.localeCompare(b.company));
    } else if (sortBy === 'activity') {
      result.sort((a, b) => (b.lastActivityDate || '').localeCompare(a.lastActivityDate || ''));
    } else if (sortBy === 'due') {
      result.sort((a, b) => (a.followUpDueDate || '9999').localeCompare(b.followUpDueDate || '9999'));
    } else if (sortBy === 'priority') {
      const rankMap = new Map();
      priorityRankings.forEach(p => {
        rankMap.set(`${p.company.toLowerCase()}-${p.role.toLowerCase()}`, p.rank);
      });
      result.sort((a, b) => {
        const rankA = rankMap.get(`${a.company.toLowerCase()}-${a.role.toLowerCase()}`) ?? 999;
        const rankB = rankMap.get(`${b.company.toLowerCase()}-${b.role.toLowerCase()}`) ?? 999;
        return rankA - rankB;
      });
    }

    return result;
  }, [applications, searchQuery, selectedStatus, sortBy, priorityRankings]);

  const currentUserObj = {
    id: 'u1',
    name: 'Maya',
    timezone: 'America/New_York'
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 text-xs font-bold transition animate-in slide-in-from-bottom-5 border ${
          toastMessage.isError 
            ? 'bg-rose-50 text-rose-900 border-rose-200' 
            : 'bg-teal-50 text-teal-900 border-teal-200'
        }`}>
          {toastMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Navbar Header */}
      <Navbar
        onOpenAddModal={() => {
          setEditingApp(null);
          setIsAppModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Centered Hero Greeting */}
        <div className="py-6 text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Hello, {currentUserObj?.name ? currentUserObj.name.split(' ')[0] : 'Maya'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            The Personal AI Assistant that partners with you to manage your job applications, interviews, and follow-ups.
          </p>
        </div>

        {/* Metric Cards Summary */}
        <StatsOverview stats={stats} selectedUser={currentUserObj} />

        {/* View Selection & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Clean Text-Only Tabs (No Icons/Emojis) */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('priority')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'priority' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Priority Ranking
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'today' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>Due Today</span>
              {todayFollowUps.length > 0 && (
                <span className={`font-extrabold px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'today' ? 'bg-white text-teal-800' : 'bg-teal-600 text-white'
                }`}>
                  {todayFollowUps.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'kanban' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Board
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'list' 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Table
            </button>
          </div>

          {/* Search, Filter, and Sort Controls */}
          <div className="flex items-center flex-wrap gap-3 flex-1 min-w-[280px] justify-end">
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="priority">Sort: Priority</option>
                <option value="company">Sort: Company</option>
                <option value="activity">Sort: Activity</option>
                <option value="due">Sort: Follow-up</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Content */}
        {activeTab === 'priority' ? (
          <PriorityView
            priorityRankings={priorityRankings}
            applications={applications}
            onStatusChange={handleStatusChange}
            onEditApplication={(app) => {
              setEditingApp(app);
              setIsAppModalOpen(true);
            }}
            onDeleteApplication={handleDeleteApplication}
            onGenerateFollowUp={(appObj) => {
              setFollowUpTargetApp(appObj);
              setIsFollowUpModalOpen(true);
            }}
            onSnoozeFollowUp={(appObj) => {
              setSnoozeTargetApp(appObj);
              setIsSnoozeModalOpen(true);
            }}
            onViewDetails={(appObj) => {
              setSelectedDetailApp(appObj);
              setIsDetailModalOpen(true);
            }}
          />
        ) : activeTab === 'today' ? (
          <TodayFollowUpsView
            followUps={todayFollowUps}
            selectedUser={currentUserObj}
            onSnoozeClick={(item) => {
              const fullAppObj = applications.find(a => a.id === item.id) || item;
              setSnoozeTargetApp(fullAppObj);
              setIsSnoozeModalOpen(true);
            }}
            onGenerateClick={(item) => {
              const fullAppObj = applications.find(a => a.id === item.id) || item;
              setFollowUpTargetApp(fullAppObj);
              setIsFollowUpModalOpen(true);
            }}
          />
        ) : activeTab === 'kanban' ? (
          <KanbanBoard
            applications={processedApplications}
            priorityRankings={priorityRankings}
            onStatusChange={handleStatusChange}
            onEditApplication={(app) => {
              setEditingApp(app);
              setIsAppModalOpen(true);
            }}
            onDeleteApplication={handleDeleteApplication}
            onViewDetails={(appObj) => {
              setSelectedDetailApp(appObj);
              setIsDetailModalOpen(true);
            }}
          />
        ) : (
          <ListView
            applications={processedApplications}
            onStatusChange={handleStatusChange}
            onEditApplication={(app) => {
              setEditingApp(app);
              setIsAppModalOpen(true);
            }}
            onDeleteApplication={handleDeleteApplication}
            onViewDetails={(appObj) => {
              setSelectedDetailApp(appObj);
              setIsDetailModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApplication}
        users={users}
        initialData={editingApp}
      />

      <FollowUpGeneratorModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setFollowUpTargetApp(null);
        }}
        application={followUpTargetApp}
        selectedUserId={selectedUserId}
      />

      <SnoozeConfirmModal
        isOpen={isSnoozeModalOpen}
        onClose={() => {
          setIsSnoozeModalOpen(false);
          setSnoozeTargetApp(null);
        }}
        application={snoozeTargetApp}
        selectedUserId={selectedUserId}
        onSuccess={(msg) => {
          showToast(msg);
          refreshAllData();
        }}
      />

      <ApplicationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailApp(null);
        }}
        application={selectedDetailApp}
        onStatusChange={handleStatusChange}
        onEditClick={(app) => {
          setEditingApp(app);
          setIsAppModalOpen(true);
        }}
        onDeleteClick={handleDeleteApplication}
        onSnoozeClick={(app) => {
          setSnoozeTargetApp(app);
          setIsSnoozeModalOpen(true);
        }}
        onGenerateClick={(app) => {
          setFollowUpTargetApp(app);
          setIsFollowUpModalOpen(true);
        }}
      />
    </div>
  );
}
