import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Trash2, 
  ShieldCheck,
  UserCheck,
  Download,
  Check
} from 'lucide-react';
import { FarmTask } from '../types';
import { playNotificationChime } from '../utils/audio';
import { exportTasksToCsv } from '../utils/csvExport';

interface TaskTrackerProps {
  tasks: FarmTask[];
  onUpdateTasks: (tasks: FarmTask[]) => void;
  onDispatchTaskAlert: (task: FarmTask) => void;
}

export const TaskTracker: React.FC<TaskTrackerProps> = ({
  tasks,
  onUpdateTasks,
  onDispatchTaskAlert
}) => {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FarmTask['category']>('Fertilization');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<FarmTask['priority']>('High');
  const [sector, setSector] = useState('Sector A (Cotton Plot)');
  const [assignedTo, setAssignedTo] = useState('Manish S.B.');
  const [exportSuccessToast, setExportSuccessToast] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleExportCsv = () => {
    exportTasksToCsv(tasks, 'Registered Farmer', 'Dharwad, Karnataka');
    playNotificationChime();
    setExportSuccessToast('Exported field task operations log to CSV!');
    setTimeout(() => setExportSuccessToast(null), 3500);
  };

  const handleToggleStatus = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus: 'Pending' | 'Completed' = t.status === 'Pending' ? 'Completed' : 'Pending';
        return {
          ...t,
          status: nextStatus
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: FarmTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      category,
      dueDate,
      priority,
      status: 'Pending',
      fieldSector: sector.trim(),
      assignedTo: assignedTo.trim()
    };

    const newTasks = [newTask, ...tasks];
    onUpdateTasks(newTasks);

    // If due today, trigger alert
    if (dueDate === today) {
      onDispatchTaskAlert(newTask);
      playNotificationChime();
    }

    setTitle('');
    setShowAddModal(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const dueTodayCount = tasks.filter(t => t.status === 'Pending' && t.dueDate === today).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              Farm Task & Field Operations
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Automated Alerts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Schedule irrigation cycles, pesticide sprays, top-dressing fertilization, and tractor maintenance with automated alert triggers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
            title="Export complete farm task logs as CSV for labor records and compliance"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Auto-Alerts Active ({dueTodayCount} due today)</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Export Success Toast */}
      {exportSuccessToast && (
        <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{exportSuccessToast} Download started automatically.</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            UTF-8 Excel Ready
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
        {(['All', 'Pending', 'Completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              filter === f
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f} ({tasks.filter(t => f === 'All' ? true : t.status === f).length})
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const isDueToday = task.dueDate === today && task.status === 'Pending';
          const isOverdue = task.dueDate < today && task.status === 'Pending';
          const isDone = task.status === 'Completed';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-stone-50 border-stone-200 opacity-75'
                  : isDueToday
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200 shadow-xs'
                  : 'bg-white border-stone-200 hover:border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleStatus(task.id)}
                  className={`mt-0.5 p-1 rounded-lg border transition cursor-pointer shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-stone-300 hover:border-emerald-600 text-transparent'
                  }`}
                  title={isDone ? 'Mark as pending' : 'Mark as done'}
                >
                  <CheckCircle2 className="w-5 h-5 fill-current" />
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {task.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      task.priority === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : task.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {task.priority} Priority
                    </span>
                    {isDueToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 animate-pulse">
                        ⏰ Due Today
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                        ⚠️ Overdue
                      </span>
                    )}
                  </div>

                  <h3 className={`font-bold text-sm sm:text-base mt-1 ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                    {task.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                    <span>Field: <strong className="text-stone-700">{task.fieldSector}</strong></span>
                    {task.assignedTo && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                        {task.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Due Date & Delete Action */}
              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div className="text-right text-xs">
                  <span className="text-stone-400 block text-[10px] font-medium">Target Date</span>
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {task.dueDate}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-1">Add Farm Task</h3>
            <p className="text-xs text-stone-500 mb-4">
              Schedule field operations with target dates and automatic reminder dispatches.
            </p>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apply 50kg Zinc Sulphate / Second weeding cycle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="Fertilization">Fertilization</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Sowing">Sowing</option>
                    <option value="Pest Control">Pest Control & Spraying</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Equipment Maintenance">Equipment Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Field Sector</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Assigned Person</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
