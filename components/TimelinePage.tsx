import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { ServiceOrder, OrderStatus } from '../types';
import { ChevronLeft, ChevronRight, ChevronDown, Filter, X, Plus, Minus } from 'lucide-react';
import { KANBAN_COLUMNS } from '../constants';

interface TimelinePageProps {
  onSelectOrder: (order: ServiceOrder) => void;
}

type ZoomLevel = 'weeks' | 'days' | 'hours';
type HourlyZoomLevel = 24 | 12 | 6;

const ROW_HEIGHT = 38;
const GROUP_HEADER_ROW_HEIGHT = 38;
const HEADER_HEIGHT = 50;
const SIDEBAR_WIDTH = 220;

const statusColors: Record<OrderStatus, { bg: string, border: string, dot: string }> = {
    [OrderStatus.Waiting]:      { bg: 'bg-blue-500/30',      border: 'border-blue-500', dot: 'bg-blue-400' },
    [OrderStatus.Shooting]:     { bg: 'bg-orange-500/30',    border: 'border-orange-500', dot: 'bg-orange-400' },
    [OrderStatus.Development]:  { bg: 'bg-yellow-500/30',    border: 'border-yellow-500', dot: 'bg-yellow-400' },
    [OrderStatus.PostProduction]: { bg: 'bg-yellow-400/30',    border: 'border-yellow-400', dot: 'bg-yellow-300' },
    [OrderStatus.ColorGrading]: { bg: 'bg-purple-500/30',    border: 'border-purple-500', dot: 'bg-purple-400' },
    [OrderStatus.Approval]:     { bg: 'bg-red-500/30',       border: 'border-red-500', dot: 'bg-red-400' },
    [OrderStatus.Delivered]:    { bg: 'bg-green-500/30',     border: 'border-green-500', dot: 'bg-green-400' },
};

const getDeadlineIndicatorClasses = (order: ServiceOrder): { border: string, pulse: string } => {
    if (order.status === OrderStatus.Delivered || !order.expectedDeliveryDate) {
        return { border: statusColors[order.status]?.border || 'border-gray-500', pulse: '' };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(order.expectedDeliveryDate);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { border: 'border-red-500', pulse: 'deadline-pulse-overdue' };
    if (diffDays <= 2) return { border: 'border-yellow-400', pulse: 'deadline-pulse-warning' };
    return { border: statusColors[order.status]?.border || 'border-gray-500', pulse: '' };
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
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
};

export const TimelinePage: React.FC<TimelinePageProps> = ({ onSelectOrder }) => {
    const { orders } = useAppContext();
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('days');
    const [hourlyZoomLevel, setHourlyZoomLevel] = useState<HourlyZoomLevel>(24);
    const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState<{ order: ServiceOrder; x: number; y: number } | null>(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [visibleDateRange, setVisibleDateRange] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const isFilterActive = selectedResponsible !== 'all' || selectedStatus !== 'all';

    const unitWidth = useMemo(() => {
        if (zoomLevel === 'hours') {
            const containerWidth = timelineContainerRef.current?.offsetWidth || window.innerWidth - SIDEBAR_WIDTH;
            return containerWidth / hourlyZoomLevel;
        }
        return zoomLevel === 'weeks' ? 200 : 60;
    }, [zoomLevel, hourlyZoomLevel, timelineContainerRef.current?.offsetWidth]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const responsibleList = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.responsible).filter(Boolean)))], [orders]);
    const statusList = useMemo(() => ['all', ...KANBAN_COLUMNS.map(c => c.status)], []);

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

    const toggleClientCollapse = (client: string) => setCollapsedClients(prev => {
        const newSet = new Set(prev);
        newSet.has(client) ? newSet.delete(client) : newSet.add(client);
        return newSet;
    });

    const filteredAndGroupedOrders = useMemo(() => {
        const filtered = orders.filter(order =>
            (selectedResponsible === 'all' || order.responsible === selectedResponsible) &&
            (selectedStatus === 'all' || order.status === selectedStatus)
        );
        return filtered.filter(o => o.creationDate).reduce((acc, order) => {
            const client = order.client || 'Sem Cliente';
            if (!acc.has(client)) acc.set(client, []);
            acc.get(client)!.push(order);
            return acc;
        }, new Map<string, ServiceOrder[]>());
    }, [orders, selectedResponsible, selectedStatus]);

    const { startDate, totalUnits } = useMemo(() => {
        const allOrders = Array.from(filteredAndGroupedOrders.values()).flat();
        let minDate: Date, maxDate: Date;

        if (allOrders.length === 0) {
            const today = new Date();
            minDate = addUnits(today, -2, 'weeks');
            maxDate = addUnits(today, 4, 'weeks');
        } else {
            minDate = new Date((allOrders[0] as ServiceOrder).creationDate);
            maxDate = addUnits(new Date((allOrders[0] as ServiceOrder).creationDate), 1, 'days');
            allOrders.forEach((order: ServiceOrder) => {
                const createDate = new Date(order.creationDate);
                if (createDate < minDate) minDate = createDate;
                const endDate = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : addUnits(createDate, 7, 'days');
                if (endDate > maxDate) maxDate = endDate;
            });
        }
        if (zoomLevel !== 'hours') { minDate.setHours(0,0,0,0); maxDate.setHours(23,59,59,999); }
        const buffer = zoomLevel === 'weeks' ? 2 : zoomLevel === 'days' ? 7 : 48;
        const finalStartDate = addUnits(minDate, -buffer, zoomLevel === 'hours' ? 'hours' : 'days');
        const finalEndDate = addUnits(maxDate, buffer, zoomLevel === 'hours' ? 'hours' : 'days');
        let total = Math.ceil(dateDiffInUnits(finalStartDate, finalEndDate, zoomLevel));
        if (zoomLevel === 'weeks') total = Math.ceil(dateDiffInUnits(finalStartDate, finalEndDate, 'days')/7);
        return { startDate: finalStartDate, totalUnits: total };
    }, [filteredAndGroupedOrders, zoomLevel]);

    const nowOffset = dateDiffInUnits(startDate, new Date(), zoomLevel);
    const nowTimeOffset = dateDiffInUnits(startDate, currentTime, 'hours');
    
    useEffect(() => {
        const el = timelineContainerRef.current;
        if (!el) return;
        const scrollPos = (nowOffset * unitWidth) - (el.offsetWidth / 2);
        el.scrollTo({ left: scrollPos, behavior: 'auto' });
    }, [startDate, zoomLevel, unitWidth]);

    const handleNavigateTime = (direction: 'prev' | 'next') => {
        const el = timelineContainerRef.current;
        if (!el) return;
        const multiplier = direction === 'prev' ? -1 : 1;
        const scrollAmount = zoomLevel === 'weeks' ? unitWidth * 2 : unitWidth * 7;
        el.scrollBy({ left: scrollAmount * multiplier, behavior: 'smooth' });
    };

    const updateVisibleDateRange = useCallback(() => {
        if (!timelineContainerRef.current) return;
        const { scrollLeft, offsetWidth } = timelineContainerRef.current;
        const startUnitIndex = Math.floor(scrollLeft / unitWidth);
        const endUnitIndex = Math.floor((scrollLeft + offsetWidth) / unitWidth);
        
        const visibleStartDate = addUnits(startDate, startUnitIndex, zoomLevel);
        const visibleEndDate = addUnits(startDate, endUnitIndex, zoomLevel);
        
        const format = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        setVisibleDateRange(`${format(visibleStartDate)} – ${format(visibleEndDate)}`);
    }, [startDate, zoomLevel, unitWidth]);

    useEffect(() => {
        const el = timelineContainerRef.current;
        if (!el) return;
        updateVisibleDateRange();
        el.addEventListener('scroll', updateVisibleDateRange);
        return () => el.removeEventListener('scroll', updateVisibleDateRange);
    }, [updateVisibleDateRange]);


    const renderHeaderUnits = () => {
        const units = [];
        let currentDate = new Date(startDate);
        for (let i = 0; i < totalUnits; i++) {
            units.push(new Date(currentDate));
            currentDate = addUnits(currentDate, 1, zoomLevel);
        }
        return units.map((unit, index) => {
            let label, subLabel;
            if (zoomLevel === 'weeks') {
                const weekEnd = addUnits(unit, 6, 'days');
                label = `${unit.getDate()} ${unit.toLocaleString('pt-BR', { month: 'short' })}`;
                subLabel = `${weekEnd.getDate()} ${weekEnd.toLocaleString('pt-BR', { month: 'short' })}`;
            } else if (zoomLevel === 'days') {
                label = unit.getDate();
                subLabel = unit.toLocaleDateString('pt-BR', { weekday: 'short' });
            } else { // hours
                label = `${String(unit.getHours()).padStart(2, '0')}:00`;
                subLabel = unit.getHours() === 0 ? unit.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'}) : null;
            }
            return (
                <div key={index} style={{ width: `${unitWidth}px` }} className="flex-shrink-0 text-center border-r border-gray-700/30 snap-start">
                    <div className="text-xs text-granite-gray-light capitalize h-5">{subLabel}</div>
                    <div className="font-bold text-lg">{label}</div>
                </div>
            )
        });
    };
    
    const clientArray = Array.from(filteredAndGroupedOrders.keys());
    const timelineRows: {type: 'group' | 'order', data: ServiceOrder | string, clientSummary?: {start: Date, end: Date}}[] = [];
    clientArray.forEach(client => {
        const orders = filteredAndGroupedOrders.get(client) || [];
        let groupStart: Date | null = null, groupEnd: Date | null = null;
        if (orders.length > 0) {
            groupStart = orders.reduce((min, o: ServiceOrder) => new Date(o.creationDate) < min ? new Date(o.creationDate) : min, new Date(orders[0].creationDate));
            groupEnd = orders.reduce((max, o: ServiceOrder) => {
                const endDate = o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate) : addUnits(new Date(o.creationDate), 7, 'days');
                return endDate > max ? endDate : max;
            }, orders[0].expectedDeliveryDate ? new Date(orders[0].expectedDeliveryDate) : addUnits(new Date(orders[0].creationDate), 7, 'days'));
        }
        timelineRows.push({ type: 'group', data: client, clientSummary: groupStart && groupEnd ? {start: groupStart, end: groupEnd} : undefined });
        if (!collapsedClients.has(client)) {
            // FIX: Explicitly typed the 'order' parameter as ServiceOrder to resolve TypeScript error where it was being inferred as 'unknown'.
            orders.forEach((order: ServiceOrder) => timelineRows.push({ type: 'order', data: order }));
        }
    });
    
    const ViewSwitcherButton: React.FC<{level: ZoomLevel, label: string}> = ({ level, label }) => (
        <button onClick={() => setZoomLevel(level)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${zoomLevel === level ? 'bg-cadmium-yellow text-coal-black' : 'bg-black/30 hover:bg-gray-700 text-gray-300'}`}>
            {label}
        </button>
    );

    return (
        <>
            <div className="h-full flex flex-col text-white bg-black/20 rounded-lg border border-granite-gray/20 p-4 gap-2">
                <header className="flex-shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleNavigateTime('prev')} className="p-2 rounded-lg bg-black/30 hover:bg-gray-700 text-gray-300"><ChevronLeft size={20}/></button>
                        <span className="font-semibold text-gray-300 text-sm w-48 text-center">{visibleDateRange}</span>
                        <button onClick={() => handleNavigateTime('next')} className="p-2 rounded-lg bg-black/30 hover:bg-gray-700 text-gray-300"><ChevronRight size={20}/></button>
                        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg ml-4">
                            <ViewSwitcherButton level="weeks" label="Semanas" />
                            <ViewSwitcherButton level="days" label="Dias" />
                            <ViewSwitcherButton level="hours" label="Horas" />
                        </div>
                        {zoomLevel === 'hours' && (
                            <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg ml-2">
                                <button onClick={() => setHourlyZoomLevel(24)} className={`px-3 py-1 text-xs rounded ${hourlyZoomLevel === 24 ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>24h</button>
                                <button onClick={() => setHourlyZoomLevel(12)} className={`px-3 py-1 text-xs rounded ${hourlyZoomLevel === 12 ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>12h</button>
                                <button onClick={() => setHourlyZoomLevel(6)} className={`px-3 py-1 text-xs rounded ${hourlyZoomLevel === 6 ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>6h</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select value={selectedResponsible} onChange={e => setSelectedResponsible(e.target.value)} className="appearance-none text-sm bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-8 py-1.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                                {responsibleList.map(r => <option key={r} value={r}>{r === 'all' ? 'Todos Responsáveis' : r}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="appearance-none text-sm bg-black/30 border border-granite-gray/50 rounded-lg pl-3 pr-8 py-1.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-cadmium-yellow">
                                {statusList.map(s => <option key={s} value={s}>{s === 'all' ? 'Todos Status' : s}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-granite-gray pointer-events-none" />
                        </div>
                        {isFilterActive && <button onClick={clearFilters} className="p-2 rounded-lg bg-black/30 hover:bg-gray-700 text-granite-gray-light hover:text-white" title="Limpar Filtros"><X size={16}/></button>}
                    </div>
                </header>
                <main ref={timelineContainerRef} className="flex-1 flex overflow-auto snap-x snap-mandatory">
                    <div className="sticky left-0 z-20 bg-[#181818] shadow-lg" style={{ width: `${SIDEBAR_WIDTH}px`}}>
                        <div style={{ height: `${HEADER_HEIGHT}px` }} className="flex items-center font-semibold text-gray-400 border-b border-r border-gray-700/30">
                            <span className="pl-4">Clientes</span>
                        </div>
                        {timelineRows.map((row, index) => {
                             if (row.type === 'group') {
                                 return (<div key={`client-${index}`} onClick={() => toggleClientCollapse(row.data as string)} style={{ height: `${GROUP_HEADER_ROW_HEIGHT}px`}} className="flex items-center pl-4 border-b border-r border-gray-700/30 text-sm font-medium text-gray-200 truncate cursor-pointer hover:bg-gray-800" title={row.data as string}>
                                     <ChevronDown size={16} className={`mr-2 transition-transform ${collapsedClients.has(row.data as string) ? '-rotate-90' : ''}`} />{row.data as string}</div>)
                             }
                             return <div key={`order-row-${index}`} style={{ height: `${ROW_HEIGHT}px` }} className="flex items-center pl-8 border-b border-r border-gray-700/30 text-xs text-granite-gray-light truncate" title={(row.data as ServiceOrder).description}>{(row.data as ServiceOrder).orderNumber}</div>
                        })}
                    </div>
                    <div className="relative" style={{ width: `${totalUnits * unitWidth}px` }}>
                        <div className="sticky top-0 z-10 flex bg-[#181818]/80 backdrop-blur-sm border-b border-gray-700/30" style={{ height: `${HEADER_HEIGHT}px` }}>{renderHeaderUnits()}</div>
                        {[...Array(totalUnits)].map((_, index) => <div key={`col-${index}`} className="absolute top-0 bottom-0 border-r border-gray-700/30" style={{ left: `${(index + 1) * unitWidth}px` }}></div>)}
                        {zoomLevel === 'hours' && [...Array(Math.floor(totalUnits / 4))].map((_, index) => <div key={`band-${index}`} className="absolute top-0 bottom-0 bg-white/5" style={{ left: `${index * 4 * unitWidth}px`, width: `${4 * unitWidth}px` }}></div>)}
                        {timelineRows.map((row, index) => <div key={`row-${index}`} className="absolute left-0 right-0 border-b border-gray-700/30" style={{ top: `${HEADER_HEIGHT + index * (row.type === 'group' ? GROUP_HEADER_ROW_HEIGHT : ROW_HEIGHT)}px`, height: `${(row.type === 'group' ? GROUP_HEADER_ROW_HEIGHT : ROW_HEIGHT)}px` }}></div>)}
                        {nowOffset >= 0 && nowOffset < totalUnits && zoomLevel !== 'hours' && (<div className="absolute top-0 bottom-0 z-10" style={{ left: `${nowOffset * unitWidth}px` }}><div className="w-0.5 h-full bg-cadmium-yellow"></div><div className="absolute top-0 -translate-x-1/2 px-1.5 py-0.5 text-xs font-bold text-coal-black bg-cadmium-yellow rounded-full">Hoje</div></div>)}
                        {zoomLevel === 'hours' && (<div className="absolute top-0 bottom-0 z-10 border-l-2 border-[#DCFF00]" style={{ left: `${nowTimeOffset * unitWidth}px` }}></div>)}

                        {timelineRows.map((row, index) => {
                            let bar;
                            let barHeight = ROW_HEIGHT - 8;
                            let topOffset = 4;
                            if (row.type === 'group' && row.clientSummary) {
                                const {start, end} = row.clientSummary;
                                bar = { startOffset: dateDiffInUnits(startDate, start, zoomLevel), duration: Math.max(0.02, dateDiffInUnits(start, end, zoomLevel)) };
                                barHeight = 8; topOffset = (GROUP_HEADER_ROW_HEIGHT - barHeight) / 2;
                            } else if (row.type === 'order') {
                                const order = row.data as ServiceOrder;
                                const orderStart = new Date(order.creationDate);
                                const defaultDuration = zoomLevel === 'hours' ? 0.5 : zoomLevel === 'days' ? 0.2 : 0.05;
                                const orderEnd = order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : addUnits(orderStart, 7, 'days');
                                bar = { startOffset: dateDiffInUnits(startDate, orderStart, zoomLevel), duration: Math.max(defaultDuration, dateDiffInUnits(orderStart, orderEnd, zoomLevel)), order };
                            }
                            if (!bar || bar.startOffset + bar.duration < 0 || bar.startOffset > totalUnits) return null;
                            const barLeft = bar.startOffset * unitWidth;
                            const barWidth = bar.duration * unitWidth;
                            let cumulativeTop = HEADER_HEIGHT;
                            // FIX: Changed invalid JSX comment to a JS comment and removed 'as any' cast.
                            // This calculation is inefficient (O(n^2)) but is being kept to preserve original logic.
                            for (let i = 0; i < index; i++) cumulativeTop += timelineRows[i].type === 'group' ? GROUP_HEADER_ROW_HEIGHT : ROW_HEIGHT;
                            const barTop = cumulativeTop + topOffset;
                            if (row.type === 'group') return <div key={`bar-${index}`} className="absolute bg-gray-600 rounded-full" style={{ left: `${barLeft}px`, width: `${barWidth}px`, top: `${barTop}px`, height: `${barHeight}px` }} />
                            if (row.type === 'order' && bar.order) {
                                const order = bar.order;
                                const { bg, border } = statusColors[order.status];
                                const { border: deadlineBorderClass, pulse: pulseClass } = getDeadlineIndicatorClasses(order);
                                return (<div key={`bar-${index}`} onClick={() => onSelectOrder(order)} onMouseEnter={(e) => handleBarMouseEnter(order, e)} onMouseMove={handleBarMouseMove} onMouseLeave={handleBarMouseLeave} className={`absolute rounded-md p-1 flex items-center cursor-pointer group transition-all hover:brightness-110 hover:z-30 ${bg} border-l-4 ${deadlineBorderClass} ${pulseClass} shadow-inner animate-fadeIn`} style={{ left: `${barLeft}px`, width: `${barWidth}px`, top: `${barTop}px`, height: `${barHeight}px`, animationDuration: '700ms' }}>
                                    <div className="absolute top-0 left-0 h-full bg-white/20 rounded-md" style={{width: `${order.progress}%`}}></div>
                                    <div className="relative truncate pl-1"><p className="font-semibold text-xs text-white truncate">{order.description}</p></div>
                                </div>);
                            }
                            return null;
                        })}
                    </div>
                </main>
            </div>
            {tooltipData && (
                <div className="fixed z-50 p-3 bg-coal-black border border-granite-gray/50 rounded-lg shadow-xl text-sm transition-opacity duration-200 pointer-events-none w-64" style={{ left: tooltipData.x + 15, top: tooltipData.y + 15, opacity: isTooltipVisible ? 1 : 0 }}>
                    <h4 className="font-bold text-white truncate">{tooltipData.order.orderNumber} - {tooltipData.order.client}</h4>
                    <p className="text-granite-gray-light my-1 text-xs">{tooltipData.order.description}</p>
                    <div className="mt-2 pt-2 border-t border-granite-gray/20 text-xs space-y-1">
                        <div className="flex items-center"><span className={`w-2 h-2 rounded-full mr-2 ${statusColors[tooltipData.order.status]?.dot}`}></span><span>{tooltipData.order.status}</span><span className="ml-auto font-semibold">{tooltipData.order.progress}%</span></div>
                        {zoomLevel === 'hours' && <div><span className="font-semibold text-gray-400 w-20 inline-block">Duração:</span> {formatDuration(tooltipData.order.creationDate, tooltipData.order.expectedDeliveryDate)}</div>}
                        <div><span className="font-semibold text-gray-400 w-20 inline-block">Responsável:</span> {tooltipData.order.responsible || 'N/A'}</div>
                        <div><span className="font-semibold text-gray-400 w-20 inline-block">Início:</span> {formatTooltipDate(tooltipData.order.creationDate)}</div>
                        <div><span className="font-semibold text-gray-400 w-20 inline-block">Previsão:</span> {formatTooltipDate(tooltipData.order.expectedDeliveryDate)}</div>
                    </div>
                </div>
            )}
        </>
    );
};