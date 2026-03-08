import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { app } from "./firebase";
import { Location, Staff, Task, TaskStatus } from "./types";
import {
  Building2,
  Users,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Menu,
  X,
  UserPlus,
  Edit2,
  Save,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

const socket = io();

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [view, setView] = useState<'tasks' | 'staff' | 'dashboard'>('dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine && socket.connected);

  useEffect(() => {
    const handleOnline = () => setIsOnline(socket.connected);
    const handleOffline = () => setIsOnline(false);
    
    const handleSocketConnect = () => setIsOnline(navigator.onLine);
    const handleSocketDisconnect = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
    };
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetch("/api/locations")
      .then((res) => res.json())
      .then(setLocations);
    fetch("/api/staff")
      .then((res) => res.json())
      .then(setStaff);
    fetch("/api/tasks")
      .then((res) => res.json())
      .then(setTasks);

    // Socket listeners
    socket.on("taskAdded", (newTask: Task) => {
      setTasks((prev) => [...prev, newTask]);
    });

    socket.on("taskUpdated", (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
    });

    socket.on("taskDeleted", (deletedId: number) => {
      setTasks((prev) => prev.filter((t) => t.id !== deletedId));
    });

    socket.on("staffAdded", (newStaff: Staff) => {
      setStaff((prev) => [...prev, newStaff]);
    });

    socket.on("staffUpdated", (updatedStaff: Staff) => {
      setStaff((prev) =>
        prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)),
      );
    });

    socket.on("staffDeleted", (deletedId: number) => {
      setStaff((prev) => prev.filter((s) => s.id !== deletedId));
      setTasks((prev) => prev.filter((t) => t.staff_id !== deletedId));
      setSelectedStaff((prev) => prev === deletedId ? null : prev);
    });

    return () => {
      socket.off("taskAdded");
      socket.off("taskUpdated");
      socket.off("taskDeleted");
      socket.off("staffAdded");
      socket.off("staffUpdated");
      socket.off("staffDeleted");
    };
  }, []);

  const handleLocationClick = (locId: number) => {
    setSelectedLocation(selectedLocation === locId ? null : locId);
    setSelectedStaff(null);
    setView('tasks');
  };

  const handleStaffClick = (staffId: number) => {
    setSelectedStaff(staffId);
    setView('tasks');
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const currentStaff = staff.find((s) => s.id === selectedStaff);
  const currentTasks = tasks.filter((t) => t.staff_id === selectedStaff);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-slate-200"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/20 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-100 mt-10 md:mt-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="text-red-600" size={24} />
              시네마 워크플로우
            </h1>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">실시간 업무 관리 시스템</p>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
              <span className="text-[10px] font-medium text-slate-600">{isOnline ? '동기화됨' : '연결 끊김'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <button
            onClick={() => {
              setView('dashboard');
              setSelectedStaff(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-2 ${view === 'dashboard' ? "bg-red-50 text-red-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <BarChart3 size={16} className={view === 'dashboard' ? "text-red-600" : "text-slate-400"} />
            전체 대시보드
          </button>
          
          <button
            onClick={() => {
              setView('staff');
              setSelectedStaff(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-4 ${view === 'staff' ? "bg-red-50 text-red-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            <UserPlus size={16} className={view === 'staff' ? "text-red-600" : "text-slate-400"} />
            직원 관리
          </button>
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">지점 목록</div>
          {locations.map((loc) => (
            <div key={loc.id} className="space-y-1">
              <button
                onClick={() => handleLocationClick(loc.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${selectedLocation === loc.id ? "bg-red-50 text-red-700" : "text-slate-700 hover:bg-slate-100"}`}
              >
                <span className="flex items-center gap-2">
                  <Building2
                    size={16}
                    className={
                      selectedLocation === loc.id
                        ? "text-red-600"
                        : "text-slate-400"
                    }
                  />
                  {loc.name}
                </span>
              </button>

              {selectedLocation === loc.id && (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  {staff
                    .filter((s) => s.location_id === loc.id)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStaffClick(s.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${selectedStaff === s.id ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                      >
                        <Users
                          size={14}
                          className={
                            selectedStaff === s.id
                              ? "text-red-200"
                              : "text-slate-400"
                          }
                        />
                        <div className="flex flex-col items-start">
                          <span>{s.name}</span>
                          <span
                            className={`text-[10px] ${selectedStaff === s.id ? "text-red-200" : "text-slate-500"}`}
                          >
                            {s.role}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {view === 'dashboard' ? (
          <Dashboard tasks={tasks} staff={staff} locations={locations} />
        ) : view === 'staff' ? (
          <StaffManagement locations={locations} staff={staff} />
        ) : selectedStaff ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-16 md:pt-10">
            <div className="max-w-4xl mx-auto space-y-8">
              <header className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {currentStaff?.name}{" "}
                    <span className="text-xl text-slate-500 font-normal">
                      {currentStaff?.role}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    {
                      locations.find((l) => l.id === currentStaff?.location_id)
                        ?.name
                    }{" "}
                    지점
                  </p>
                </div>
                <div className="text-sm text-slate-500">
                  총 업무:{" "}
                  <span className="font-medium text-slate-900">
                    {currentTasks.length}
                  </span>
                </div>
              </header>

              <TaskList tasks={currentTasks} staffId={selectedStaff} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-6 text-center">
            <div>
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-500">
                직원을 선택해주세요
              </p>
              <p className="text-sm mt-1">
                좌측 메뉴에서 지점과 직원을 선택하여 업무를 확인하세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ tasks, staff, locations }: { tasks: Task[], staff: Staff[], locations: Location[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1); // Start of current month
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(new Date(year, month, i));
  }

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const prevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    setCurrentDate(d);
  };

  const getTaskStyle = (task: Task) => {
    if (!task.start_date || !task.end_date) return { display: 'none' };
    
    const tStart = new Date(task.start_date);
    tStart.setHours(0, 0, 0, 0);
    const tEnd = new Date(task.end_date);
    tEnd.setHours(0, 0, 0, 0);
    
    if (tEnd < startDate || tStart > endDate) return { display: 'none' };

    const visibleStart = new Date(Math.max(tStart.getTime(), startDate.getTime()));
    const visibleEnd = new Date(Math.min(tEnd.getTime(), endDate.getTime()));

    const startDiff = (visibleStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (visibleEnd.getTime() - visibleStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    // Day column width is 48px (w-12)
    const left = startDiff * 48;
    const width = duration * 48;

    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-16 md:pt-10 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              전체 대시보드
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              모든 지점 매니저들의 업무 진행 상황을 한눈에 확인하세요.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="이전 달">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-2 font-medium text-slate-700 min-w-[110px] justify-center">
              <Calendar size={16} className="text-red-600" />
              {year}년 {month + 1}월
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="다음 달">
              <ChevronRight size={18} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium hover:bg-slate-100 rounded-md text-slate-600 transition-colors">
              이번 달
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header: Dates */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-48 flex-shrink-0 border-r border-slate-200 font-medium text-sm text-slate-600 flex">
                  <div className="w-8 border-r border-slate-200 flex-shrink-0 bg-slate-100/50"></div>
                  <div className="p-3 flex items-center justify-center flex-1">직원</div>
                </div>
                <div className="flex">
                  {dates.map((d, i) => {
                    const isToday = d.getTime() === today.getTime();
                    const isSaturday = d.getDay() === 6;
                    const isSunday = d.getDay() === 0;
                    
                    let bgClass = 'bg-slate-50';
                    let textClass = 'text-slate-500';
                    
                    if (isToday) {
                      bgClass = 'bg-red-50';
                      textClass = 'text-red-700 font-bold';
                    } else if (isSunday) {
                      bgClass = 'bg-red-50/50';
                      textClass = 'text-red-500';
                    } else if (isSaturday) {
                      bgClass = 'bg-blue-50/50';
                      textClass = 'text-blue-500';
                    }

                    return (
                      <div 
                        key={i} 
                        className={`w-12 flex-shrink-0 text-center py-2 text-xs border-r border-slate-100 ${bgClass} ${textClass}`}
                      >
                        <div>{d.getMonth() + 1}/{d.getDate()}</div>
                        <div className={isToday ? 'text-red-500' : isSunday ? 'text-red-400' : isSaturday ? 'text-blue-400' : 'text-slate-400'}>
                          {['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Body: Staff and Tasks */}
              <div className="flex flex-col">
                {locations.map(location => {
                  const locationStaff = staff.filter(s => s.location_id === location.id);
                  if (locationStaff.length === 0) return null;

                  return (
                    <div key={`loc-${location.id}`} className="flex border-b-2 border-slate-300 last:border-b-0">
                      {/* Location Name Column (Vertically Centered) */}
                      <div className="w-8 flex-shrink-0 bg-slate-100/50 border-r border-slate-200 flex items-center justify-center py-2 z-10">
                        <div className="flex flex-col items-center gap-1">
                          {location.name.split('').map((char, charIdx) => (
                            <span key={charIdx} className="text-sm font-semibold text-slate-700 leading-none">
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Staff Rows */}
                      <div className="flex flex-col divide-y divide-slate-100">
                        {locationStaff.map((s) => {
                          const staffTasks = tasks.filter(t => t.staff_id === s.id);
                          
                          const sortedTasks = [...staffTasks].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
                          const tracks: number[] = [];
                          const taskTracks = new Map<number, number>();
                          
                          sortedTasks.forEach(task => {
                            const start = new Date(task.start_date);
                            start.setHours(0,0,0,0);
                            const startT = start.getTime();
                            
                            const end = new Date(task.end_date);
                            end.setHours(0,0,0,0);
                            const endT = end.getTime();
                            
                            let placed = false;
                            for (let i = 0; i < tracks.length; i++) {
                              if (tracks[i] < startT) {
                                tracks[i] = endT;
                                taskTracks.set(task.id, i);
                                placed = true;
                                break;
                              }
                            }
                            if (!placed) {
                              tracks.push(endT);
                              taskTracks.set(task.id, tracks.length - 1);
                            }
                          });
                          
                          const numTracks = Math.max(1, tracks.length);
                          const rowHeight = Math.max(64, numTracks * 32 + 16);
                          
                          return (
                            <div key={s.id} className="flex group hover:bg-slate-50/50 transition-colors" style={{ minHeight: `${rowHeight}px` }}>
                              {/* Staff Info */}
                              <div className="w-40 flex-shrink-0 border-r border-slate-200 bg-white group-hover:bg-slate-50/50 z-10 p-3 flex flex-col justify-center items-center text-center">
                                <div className="font-medium text-sm text-slate-900">{s.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{s.role}</div>
                              </div>
                              
                              {/* Gantt Area */}
                              <div className="flex relative flex-1">
                              {/* Grid lines */}
                              {dates.map((d, i) => {
                                const isToday = d.getTime() === today.getTime();
                                const isSaturday = d.getDay() === 6;
                                const isSunday = d.getDay() === 0;
                                
                                let bgClass = '';
                                if (isToday) bgClass = 'bg-red-50/30';
                                else if (isSunday) bgClass = 'bg-red-50/20';
                                else if (isSaturday) bgClass = 'bg-blue-50/20';

                                return (
                                  <div key={i} className={`w-12 flex-shrink-0 border-r border-slate-100 ${bgClass}`} />
                                );
                              })}
                              
                              {/* Task Bars */}
                              <div className="absolute inset-0 py-2">
                                {staffTasks.map(task => {
                                  const style = getTaskStyle(task);
                                  if (style.display === 'none') return null;
                                  
                                  const trackIdx = taskTracks.get(task.id) || 0;
                                  const topPos = trackIdx * 32 + 8;
                                  
                                  return (
                                    <div 
                                      key={task.id}
                                      onClick={() => setSelectedTask(task)}
                                      className={`absolute h-6 rounded-md text-xs px-2.5 flex items-center overflow-hidden whitespace-nowrap shadow-sm border cursor-pointer hover:opacity-80 transition-opacity font-medium ${
                                        task.status === 'Completed' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
                                        task.status === 'In Progress' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                                        'bg-red-100 border-red-200 text-red-800'
                                      }`}
                                      style={{ ...style, top: `${topPos}px` }}
                                      title={`${task.name}: ${task.title || '제목 없음'} (클릭하여 상세 보기)`}
                                    >
                                      {task.title || task.name}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                {selectedTask.title || '제목 없음'}
              </h3>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">업무명 (분류)</div>
                  <div className="text-base font-medium text-slate-900">{selectedTask.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">상태</div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedTask.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    selectedTask.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedTask.status === 'Completed' ? '완료' : selectedTask.status === 'In Progress' ? '진행중' : '대기'}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">담당자</div>
                <div className="text-sm text-slate-900">
                  {staff.find(s => s.id === selectedTask.staff_id)?.name} 
                  <span className="text-slate-500 ml-1">
                    ({locations.find(l => l.id === staff.find(s => s.id === selectedTask.staff_id)?.location_id)?.name})
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">진행기간</div>
                <div className="text-sm text-slate-900 flex items-center gap-2">
                  <span className="bg-slate-100 px-2 py-1 rounded text-slate-700">{selectedTask.start_date || '미정'}</span>
                  <span className="text-slate-400">~</span>
                  <span className="bg-slate-100 px-2 py-1 rounded text-slate-700">{selectedTask.end_date || '미정'}</span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">상세 내용</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[120px] leading-relaxed">
                  {selectedTask.content || <span className="text-slate-400 italic">입력된 내용이 없습니다.</span>}
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedTask(null)} 
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffManagement({ locations, staff }: { locations: Location[], staff: Staff[] }) {
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("");
  const [newStaffLocation, setNewStaffLocation] = useState<number>(locations[0]?.id || 0);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editLocation, setEditLocation] = useState<number>(0);
  
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);

  // Update default location when locations load
  useEffect(() => {
    if (locations.length > 0 && !newStaffLocation) {
      setNewStaffLocation(locations[0].id);
    }
  }, [locations, newStaffLocation]);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffRole.trim() || !newStaffLocation) return;
    
    socket.emit("addStaff", {
      location_id: newStaffLocation,
      name: newStaffName,
      role: newStaffRole
    });
    
    setNewStaffName("");
    setNewStaffRole("");
  };

  const startEdit = (s: Staff) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRole(s.role);
    setEditLocation(s.location_id);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editRole.trim() || !editLocation || !editingId) return;
    socket.emit("updateStaff", {
      id: editingId,
      location_id: editLocation,
      name: editName,
      role: editRole
    });
    setEditingId(null);
  };

  const deleteStaff = (id: number) => {
    setStaffToDelete(id);
  };

  const confirmDelete = () => {
    if (staffToDelete !== null) {
      socket.emit("deleteStaff", staffToDelete);
      setStaffToDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-16 md:pt-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-slate-200 pb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            직원 관리
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            새로운 직원을 등록하거나 기존 직원 정보를 수정 및 삭제합니다.
          </p>
        </header>

        {/* Add Staff Form */}
        <form onSubmit={handleAddStaff} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">지점</label>
            <select 
              value={newStaffLocation} 
              onChange={e => setNewStaffLocation(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value={0} disabled>지점 선택</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">이름</label>
            <input 
              type="text" 
              value={newStaffName}
              onChange={e => setNewStaffName(e.target.value)}
              placeholder="직원 이름"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex-1 space-y-1 w-full">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">직급/역할</label>
            <input 
              type="text" 
              value={newStaffRole}
              onChange={e => setNewStaffRole(e.target.value)}
              placeholder="예: 매니저, 스태프"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={!newStaffName.trim() || !newStaffRole.trim() || !newStaffLocation}
            className="w-full md:w-auto px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            등록
          </button>
        </form>

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">지점</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">직급/역할</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">등록된 직원이 없습니다.</td>
                </tr>
              ) : (
                staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    {editingId === s.id ? (
                      <>
                        <td className="px-4 py-2">
                          <select 
                            value={editLocation} 
                            onChange={e => setEditLocation(Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-red-500"
                          >
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-red-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={editRole}
                            onChange={e => setEditRole(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-red-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={saveEdit} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="저장">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="취소">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-slate-600">
                          {locations.find(l => l.id === s.location_id)?.name}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.role}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="수정">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteStaff(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="삭제">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {staffToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setStaffToDelete(null)}>
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">직원 삭제</h3>
              <p className="text-sm text-slate-500">
                정말 삭제하시겠습니까?<br/>해당 직원의 모든 업무도 함께 삭제됩니다.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button 
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskList({ tasks, staffId }: { tasks: Task[]; staffId: number }) {
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskContent, setNewTaskContent] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    socket.emit("addTask", {
      staff_id: staffId,
      name: newTaskName,
      title: newTaskTitle,
      start_date: newTaskStartDate,
      end_date: newTaskEndDate,
      content: newTaskContent,
      status: "Pending",
    });

    setNewTaskName("");
    setNewTaskTitle("");
    setNewTaskStartDate("");
    setNewTaskEndDate("");
    setNewTaskContent("");
  };

  const updateTaskStatus = (
    id: number,
    status: TaskStatus,
    title: string,
    start_date: string,
    end_date: string,
    content: string,
  ) => {
    socket.emit("updateTask", { id, status, title, start_date, end_date, content });
  };

  const deleteTask = (id: number) => {
    socket.emit("deleteTask", id);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case "In Progress":
        return <Clock className="text-amber-500" size={20} />;
      default:
        return <Circle className="text-slate-300" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <form
        onSubmit={handleAddTask}
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              업무명 (분류)
            </label>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="예: 오픈 준비"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              제목
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="상세 제목 입력..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              진행기간
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newTaskStartDate}
                onChange={(e) => setNewTaskStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={newTaskEndDate}
                onChange={(e) => setNewTaskEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            내용
          </label>
          <textarea
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="업무 내용 (무제한 입력 가능)..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[80px] resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newTaskName.trim()}
            className="w-full md:w-auto px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            할당된 업무가 없습니다.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={(status, title, start_date, end_date, content) =>
                updateTaskStatus(task.id, status, title, start_date, end_date, content)
              }
              onDelete={() => deleteTask(task.id)}
              getStatusIcon={getStatusIcon}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  onUpdate,
  onDelete,
  getStatusIcon,
}: {
  key?: React.Key;
  task: Task;
  onUpdate: (status: TaskStatus, title: string, start_date: string, end_date: string, content: string) => void;
  onDelete: () => void;
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
}) {
  const [localTitle, setLocalTitle] = useState(task.title || "");
  const [localStartDate, setLocalStartDate] = useState(task.start_date || "");
  const [localEndDate, setLocalEndDate] = useState(task.end_date || "");
  const [localContent, setLocalContent] = useState(task.content || "");

  // Sync local state if task updates from server
  useEffect(() => {
    setLocalTitle(task.title || "");
    setLocalStartDate(task.start_date || "");
    setLocalEndDate(task.end_date || "");
    setLocalContent(task.content || "");
  }, [task.title, task.start_date, task.end_date, task.content]);

  const handleBlur = () => {
    if (
      localTitle !== task.title ||
      localStartDate !== task.start_date ||
      localEndDate !== task.end_date ||
      localContent !== task.content
    ) {
      onUpdate(task.status, localTitle, localStartDate, localEndDate, localContent);
    }
  };

  return (
    <div
      className={`group flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all ${task.status === "Completed" ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="flex flex-col gap-2 mt-1 flex-shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name={`status-${task.id}`} 
              checked={task.status === 'Pending'}
              onChange={() => onUpdate('Pending', localTitle, localStartDate, localEndDate, localContent)}
              className="w-3.5 h-3.5 text-slate-600 cursor-pointer"
            />
            <span className={`text-xs font-medium ${task.status === 'Pending' ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>예정</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name={`status-${task.id}`} 
              checked={task.status === 'In Progress'}
              onChange={() => onUpdate('In Progress', localTitle, localStartDate, localEndDate, localContent)}
              className="w-3.5 h-3.5 text-amber-500 cursor-pointer"
            />
            <span className={`text-xs font-medium ${task.status === 'In Progress' ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'}`}>진행</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name={`status-${task.id}`} 
              checked={task.status === 'Completed'}
              onChange={() => onUpdate('Completed', localTitle, localStartDate, localEndDate, localContent)}
              className="w-3.5 h-3.5 text-emerald-500 cursor-pointer"
            />
            <span className={`text-xs font-medium ${task.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>종료</span>
          </label>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${task.status === "Completed" ? "text-slate-500 line-through" : "text-slate-900"}`}
            >
              {task.name}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                task.status === "Completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : task.status === "In Progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {task.status === "Completed"
                ? "완료"
                : task.status === "In Progress"
                  ? "진행중"
                  : "대기"}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="제목 입력..."
              className={`flex-1 text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-red-500 focus:bg-white rounded px-2 py-1 transition-colors ${task.status === "Completed" ? "text-slate-400" : "text-slate-700 font-medium"}`}
            />
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                onBlur={handleBlur}
                className="bg-transparent border border-transparent hover:border-slate-200 focus:border-red-500 focus:bg-white rounded px-1 py-1 transition-colors"
              />
              <span>~</span>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                onBlur={handleBlur}
                className="bg-transparent border border-transparent hover:border-slate-200 focus:border-red-500 focus:bg-white rounded px-1 py-1 transition-colors"
              />
            </div>
          </div>

          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleBlur}
            placeholder="업무 내용 (무제한 입력 가능)..."
            className={`w-full text-sm bg-transparent border border-transparent hover:border-slate-200 focus:border-red-500 focus:bg-white rounded px-2 py-1 transition-colors min-h-[60px] resize-y ${task.status === "Completed" ? "text-slate-400" : "text-slate-600"}`}
          />
        </div>
      </div>

      <div className="flex items-start justify-end md:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="삭제"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
