import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { ServiceOrder, OrderStatus, KanbanColumn } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, Filter, X, Plus, Minus, Calendar, StickyNote } from 'lucide-react';

interface TimelinePageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

type ZoomLevel = 'weeks' | 'days' | 'hours';
type HourlyZoomLevel = 24 | 12 | 6;

const ROW_HEIGHT = 50; // Increased height for notes
const GROUP_HEADER_ROW_HEIGHT = 38;
const HEADER_HEIGHT = 50;
const SIDEBAR_WIDTH = 220;

type StatusColorMap = Record<OrderStatus, { bg: string, border: string, dot: string }>;

const generateStatusColors = (kanbanColumns: KanbanColumn[]): StatusColorMap => {
    const colorMap: Partial<StatusColorMap> = {};
    kanbanColumns.forEach(column => {
        // A simple hashing function to create slight variations for bg/border/dot from a single source color
        const hash = column.color.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const h = (hash % 360 + 360) % 360; // Ensure hue is positive
        const s = 60 + (Math.abs(hash) % 20); // Saturation between 60-80
        const l_bg = 25; // Lightness for background
        const l_border = 45; // Lightness for border
        const l_dot = 55; // Lightness for dot

        colorMap[column.status] = {
            bg: `hsl(${h}, ${s}%, ${l_bg}%)`,
            border: `hsl(${h}, ${s}%, ${l_border}%)`,
            dot: column.color, // Use the direct color for the dot
        }
    });
    return colorMap as StatusColorMap;
};

const getDeadlineIndicatorClasses = (order: ServiceOrder, statusColors: StatusColorMap): { border: string, pulse: string, bg: string } => {
    const defaultBorder = statusColors[order.status]?.border || '#6b7280';
    const defaultBg = statusColors[order.status]?.bg || 'hsl(240, 4%, 20%)';
    
    if (order.status === 'Entregue' || !order.expectedDeliveryDate) {
        return { border: defaultBorder, pulse: '', bg: defaultBg };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(order.expectedDeliveryDate);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        // Overdue: Red
        return { border: '#ef4444', pulse: 'deadline-pulse-overdue', bg: 'hsl(0, 50%, 28%)' };
    }
    if (diffDays <= 2) {
        // Warning: Yellow
        return { border: '#eab308', pulse: 'deadline-pulse-warning', bg: 'hsl(45, 70%, 22%)' };
    }
    // Default
    return { border: defaultBorder, pulse: '', bg: defaultBg };
};


const dateDiffInUnits = (d1: Date, d2: Date, unit: ZoomLevel): number => {
    const t2 = d2.getTime();
    const t1 = d1.getTime();
    let divisor;
    switch (unit) {
        case 'hours': divisor = 1000 * 60 * 60; break;
        case 'days': divisor = 1000 * 60 * 60 * 24; break;
        case 'weeks': divisor = 1000 * 60 * 60 * 24 * 7; break;
    }
    return (t2 - t1) / divisor;
};

const addUnits = (date: Date, amount: number, unit: ZoomLevel): Date => {
    const result = new Date(date);
    switch (unit) {
        case 'hours': result.setHours(result.getHours() + amount); break;
        case 'days': result.setDate(result.getDate() + amount); break;
        case 'weeks': result.setDate(result.getDate() + amount * 7); break;
    }
    return result;
};

const formatTooltipDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (start: string, end: string | undefined): string => {
    if (!end) return 'N/A';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${totalDays} dia(s)`;
};

export const TimelinePage: React.FC<TimelinePageProps> = ({ onSelectOrder }) => {
    const { orders, kanbanColumns, updateOrder } = useAppContext();
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('days');
    const [hourlyZoomLevel, setHourlyZoomLevel] = useState<HourlyZoomLevel>(24);
    const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState<{ order: ServiceOrder; x: number; y: number } | null>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [noteTooltip, setNoteTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
    const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [visibleDateRange, setVisibleDateRange] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const statusColors = useMemo(() => generateStatusColors(kanbanColumns), [kanbanColumns]);

    const isFilterActive = selectedResponsible !== 'all' || selectedStatus !== 'all';

    const unitWidth = useMemo(() => {
        if (zoomLevel === 'hours') {
            return (window.innerWidth - SIDEBAR_WIDTH) / hourlyZoomLevel;
        }
        return zoomLevel === 'weeks' ? 200 : 60;
    }, [zoomLevel, hourlyZoomLevel]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const responsibleList = useMemo(() => {
        const responsibleNames = orders
            .map(o => o.responsible)
            .filter((r): r is string => !!r);
        const uniqueNames = Array.from(new Set(responsibleNames)).sort();
        return ['all', ...uniqueNames];
    }, [orders]);
    
    const statusList = useMemo(() => ['all', ...kanbanColumns.map(c => c.status)], [kanbanColumns]);

    const clearFilters = () => {
        setSelectedResponsible('all');
        setSelectedStatus('all');
    };

    const handleBarMouseEnter = useCallback((order: ServiceOrder, e: React.MouseEvent) => {
        setTooltipData({ order, x: e.clientX, y: e.clientY });
        setTimeout(() => setIsTooltipVisible(true), 50);
    }, []);
    const handleBarMouseMove = useCallback((e: React.MouseEvent) => setTooltipData(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null), []);
    const handleBarMouseLeave = useCallback(() => {
        setIsTooltipVisible(false);
        setTimeout(() => setTooltipData(null), 200);
    }, []);

    const toggleClientCollapse = (client: string) => {
        setCollapsedClients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(client)) {
                newSet.delete(client);
            } else {
                newSet.add(client);
            }
            return newSet;
        });
    };

    const handleNoteChange = (order: ServiceOrder, newText: string) => {
        if (order.notes === newText) return;
        const updatedOrder = { ...order, notes: newText };
        updateOrder(updatedOrder);
    };

    const filteredAndGroupedOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            if (selectedResponsible !== 'all' && order.responsible !== selectedResponsible) return false;
            if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
            return true;
        });

        // FIX: Replaced reduce with a standard for...of loop to ensure correct type inference for the 'grouped' object.
        const grouped: Record<string, ServiceOrder[]> = {};
        for (const order of filtered) {
            const clientName = order.client;
            if (!grouped[clientName]) {
                grouped[clientName] = [];
            }
            grouped[clientName].push(order);
        }
        
        // This comment seems to be from a previous fix, keeping it for context.
        // FIX: Sort orders within each group immutably and then sort groups by client name.
        // This avoids mutation inside useMemo and fixes the potential type error.
        return Object.entries(grouped)
            .map(([client, clientOrders]) => {
                const sortedOrders = [...clientOrders].sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
                return [client, sortedOrders] as [string, ServiceOrder[]];
            })
            .sort((a, b) => a[0].localeCompare(b[0]));
    }, [orders, selectedResponsible, selectedStatus]);

    const [startDate, endDate] = useMemo(() => {
        if (orders.length === 0) {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return [startOfMonth, endOfMonth];
        }
        let min = new Date();
        let max = new Date(0);
        orders.forEach(o => {
            const start = new Date(o.creationDate);
            const end = new Date(o.expectedDeliveryDate || o.lastStatusUpdate);
            if (start < min) min = start;
            if (end > max) max = end;
        });
        
        min.setDate(min.getDate() - 14);
        max.setDate(max.getDate() + 28);
        return [min, max];
    }, [orders]);

    const totalWidth = dateDiffInUnits(startDate, endDate, zoomLevel) * unitWidth;

    const timelineHeaders = useMemo(() => {
        const headers: { date: Date, label: string }[] = [];
        let current = new Date(startDate);
        current.setHours(0,0,0,0);
        
        while (current <= endDate) {
            if (zoomLevel === 'weeks') {
                headers.push({ date: new Date(current), label: current.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) });
                current.setDate(current.getDate() + 7);
            } else {
                headers.push({ date: new Date(current), label: current.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) });
                current.setDate(current.getDate() + 1);
            }
        }
        return headers;
    }, [startDate, endDate, zoomLevel]);

    const scrollToToday = useCallback(() => {
        if (timelineContainerRef.current) {
            const offset = dateDiffInUnits(startDate, new Date(), zoomLevel) * unitWidth;
            const containerWidth = timelineContainerRef.current.offsetWidth;
            timelineContainerRef.current.scrollLeft = offset - containerWidth / 3;
        }
    }, [startDate, zoomLevel, unitWidth]);

    useEffect(() => {
        scrollToToday();
        const handleScroll = () => {
            if(sidebarRef.current && timelineContainerRef.current) {
                sidebarRef.current.scrollTop = timelineContainerRef.current.scrollTop;
            }
        };
        const container = timelineContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [scrollToToday]);

    useEffect(() => {
        const container = timelineContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);
    
    const nowPosition = dateDiffInUnits(startDate, currentTime, zoomLevel) * unitWidth;

    return (
      <div className="flex flex-col h-full bg-black/20 rounded-lg border border-granite-gray/20 text-white overflow-hidden animate-fadeIn">
          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-granite-gray/20 bg-coal-black">
              <div className="flex items-center gap-2">
                  <button onClick={scrollToToday} className="flex items-center px-3 py-1.5 bg-granite-gray/20 rounded-lg text-sm font-semibold text-gray-300 hover:bg-granite-gray/40 transition-colors"><Calendar size={16} className="mr-2"/>Hoje</button>
              </div>
              <div className="flex items-center gap-4">
                  {isFilterActive && (
                      <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-yellow-300 hover:text-white"><X size={14}/>Limpar Filtros</button>
                  )}
                  <select value={selectedResponsible} onChange={e => setSelectedResponsible(e.target.value)} className="bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1 text-sm">
                      {responsibleList.map(r => <option key={r} value={r}>{r === 'all' ? 'Todos Responsáveis' : r}</option>)}
                  </select>
                  <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="bg-black/30 border border-granite-gray/50 rounded-lg px-2 py-1 text-sm">
                      {statusList.map(s => {
                          const column = kanbanColumns.find(c => c.status === s);
                          return <option key={s} value={s}>{s === 'all' ? 'Todos os Status' : column?.title || s}</option>
                      })}
                  </select>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => setZoomLevel('weeks')} className={`px-3 py-1 text-sm font-semibold rounded ${zoomLevel === 'weeks' ? 'bg-cadmium-yellow text-coal-black' : 'bg-granite-gray/20'}`}>Semanas</button>
                 <button onClick={() => setZoomLevel('days')} className={`px-3 py-1 text-sm font-semibold rounded ${zoomLevel === 'days' ? 'bg-cadmium-yellow text-coal-black' : 'bg-granite-gray/20'}`}>Dias</button>
              </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div ref={sidebarRef} className="w-[220px] flex-shrink-0 bg-black/20 overflow-hidden border-r border-granite-gray/20">
                  <div className="h-[50px] flex items-center p-2 font-bold text-gray-400 border-b-2 border-granite-gray/20 bg-coal-black sticky top-0 z-30">Cliente / OS</div>
                  <div style={{height: `${(filteredAndGroupedOrders.reduce((acc, [, orders]) => acc + (collapsedClients.has(orders[0]?.client) ? 0 : orders.length), 0) * ROW_HEIGHT) + (filteredAndGroupedOrders.length * GROUP_HEADER_ROW_HEIGHT)}px`}}>
                    {filteredAndGroupedOrders.map(([client, clientOrders]) => (
                        <div key={client}>
                            <div onClick={() => toggleClientCollapse(client)} style={{ height: `${GROUP_HEADER_ROW_HEIGHT}px`}} className="flex items-center p-2 bg-granite-gray/10 cursor-pointer hover:bg-granite-gray/20 font-semibold border-b border-t border-granite-gray/10">
                                <ChevronDown size={16} className={`mr-2 transition-transform ${collapsedClients.has(client) ? '-rotate-90' : ''}`}/>
                                <span className="truncate">{client}</span>
                            </div>
                            {!collapsedClients.has(client) && clientOrders.map(order => (
                                <div key={order.id} style={{ height: `${ROW_HEIGHT}px`}} className="group flex flex-col justify-center p-2 text-sm text-gray-300 border-b border-granite-gray/10 hover:bg-cadmium-yellow/10">
                                    <div 
                                        onClick={() => onSelectOrder(order)}
                                        className="flex items-center cursor-pointer"
                                    >
                                        <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: statusColors[order.status]?.dot || '#808080' }}></div>
                                        <span className="truncate font-semibold">{order.orderNumber}</span>
                                        {order.notes && (
                                            <StickyNote
                                                size={14}
                                                className="ml-2 text-granite-gray-light flex-shrink-0"
                                                onMouseEnter={(e) => {
                                                    e.stopPropagation();
                                                    setNoteTooltip({ content: order.notes!, x: e.clientX, y: e.clientY });
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.stopPropagation();
                                                    setNoteTooltip(null);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <input 
                                        type="text"
                                        defaultValue={order.notes || ''}
                                        onBlur={(e) => handleNoteChange(order, e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                        placeholder="Adicionar nota rápida..."
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-transparent text-xs text-granite-gray-light placeholder-granite-gray/70 border-none p-0 focus:ring-0 focus:bg-black/20 focus:text-white rounded -mx-1 px-1"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                  </div>
              </div>

              {/* Grid */}
              <div ref={timelineContainerRef} className="flex-1 overflow-auto relative kanban-container">
                   <div style={{ width: `${totalWidth}px` }} className="relative">
                      {/* Header */}
                      <div className="sticky top-0 z-20 bg-coal-black h-[50px] border-b-2 border-granite-gray/20">
                          {timelineHeaders.map(({date, label}) => (
                              <div key={date.toISOString()} style={{ width: `${unitWidth}px`, left: `${dateDiffInUnits(startDate, date, zoomLevel) * unitWidth}px` }} className="absolute top-0 h-full flex items-center justify-center border-r border-granite-gray/20 text-sm font-semibold text-gray-400">
                                  {label}
                              </div>
                          ))}
                      </div>
                      
                      {/* Body */}
                      <div className="relative">
                          {/* Grid Lines */}
                          {timelineHeaders.map(({date}) => (
                              <div key={date.toISOString()} style={{ left: `${dateDiffInUnits(startDate, date, zoomLevel) * unitWidth}px` }} className="absolute top-0 h-full w-px bg-granite-gray/20"></div>
                          ))}
                          {/* Order Bars */}
                          {(() => {
                              let yOffset = 0;
                              return filteredAndGroupedOrders.map(([client, clientOrders]) => {
                                  const startY = yOffset;
                                  yOffset += GROUP_HEADER_ROW_HEIGHT;
                                  if (!collapsedClients.has(client)) {
                                      yOffset += clientOrders.length * ROW_HEIGHT;
                                  }
                                  return (
                                      <React.Fragment key={client}>
                                          {!collapsedClients.has(client) && clientOrders.map((order, i) => {
                                              const start = new Date(order.creationDate);
                                              const end = new Date(order.expectedDeliveryDate || order.lastStatusUpdate);
                                              const left = dateDiffInUnits(startDate, start, zoomLevel) * unitWidth;
                                              const width = Math.max(dateDiffInUnits(start, end, zoomLevel) * unitWidth, 10);
                                              const top = startY + GROUP_HEADER_ROW_HEIGHT + (i * ROW_HEIGHT);
                                              const deadlineClasses = getDeadlineIndicatorClasses(order, statusColors);
                                              const column = kanbanColumns.find(c => c.status === order.status);
                                              
                                              return (
                                                <div
                                                  key={order.id}
                                                  className={`absolute h-[28px] rounded-md flex items-center px-2 text-xs font-semibold overflow-hidden transition-all duration-300 border-l-4 ${deadlineClasses.pulse}`}
                                                  style={{ 
                                                    top: `${top + 11}px`, // Adjusted for new row height 
                                                    left: `${left}px`, 
                                                    width: `${width}px`,
                                                    backgroundColor: deadlineClasses.bg,
                                                    borderColor: deadlineClasses.border
                                                  }}
                                                  onMouseEnter={(e) => handleBarMouseEnter(order, e)}
                                                  onMouseMove={handleBarMouseMove}
                                                  onMouseLeave={handleBarMouseLeave}
                                                  onClick={() => onSelectOrder(order)}
                                                >
                                                    <span className="truncate text-white">{order.orderNumber} ({column?.title || order.status})</span>
                                                </div>
                                              )
                                          })}
                                      </React.Fragment>
                                  );
                              });
                          })()}
                      </div>
                      
                      {/* Now Line */}
                      <div className="absolute top-0 h-full w-0.5 bg-red-500 z-10" style={{ left: `${nowPosition}px`}}>
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      </div>
                   </div>
              </div>
          </div>

          {/* Bar Tooltip */}
          {tooltipData && (
              <div 
                  className={`fixed p-3 bg-coal-black border border-granite-gray/30 rounded-lg shadow-xl z-50 pointer-events-none transition-opacity duration-200 ${isTooltipVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ top: tooltipData.y + 15, left: tooltipData.x + 15, maxWidth: '250px' }}
              >
                  <p className="font-bold text-base text-white">{tooltipData.order.client}</p>
                  <p className="text-sm text-gray-300 mb-2">{tooltipData.order.description}</p>
                  <div className="text-xs text-granite-gray-light space-y-1 border-t border-granite-gray/20 pt-2">
                      <p><strong>Início:</strong> {formatTooltipDate(tooltipData.order.creationDate)}</p>
                      <p><strong>Prazo:</strong> {formatTooltipDate(tooltipData.order.expectedDeliveryDate)}</p>
                      <p><strong>Duração:</strong> {formatDuration(tooltipData.order.creationDate, tooltipData.order.expectedDeliveryDate)}</p>
                      <p><strong>Status:</strong> <span className="font-semibold text-gray-200">{kanbanColumns.find(c => c.status === tooltipData.order.status)?.title || tooltipData.order.status}</span></p>
                  </div>
              </div>
          )}
          
          {/* Note Tooltip */}
          {noteTooltip && (
            <div
                className="fixed p-2 bg-black border border-granite-gray/50 rounded-md shadow-lg z-50 pointer-events-none text-sm text-gray-200 whitespace-pre-wrap"
                style={{ top: noteTooltip.y + 15, left: noteTooltip.x + 15, maxWidth: '250px' }}
            >
                {noteTooltip.content}
            </div>
          )}
      </div>
    );
};
