import React, { useState, useRef, useEffect } from 'react';
import { ServiceOrder, ActivityLogEntry, OrderStatus, ActivityActionType, WeeklyReportData, AppNotification, NotificationColorType } from '../types';
import { BarChart3, CalendarCheck, Clock, CheckCircle, AlertTriangle, Users, FileDown, PieChart, Send, Eye, Download, ChevronLeft } from 'lucide-react';
import { useAppContext } from './AppContext';

declare const Chart: any;
declare const jspdf: any;

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-black/20 p-4 rounded-lg flex items-center border border-granite-gray/20">
…                        <p className="text-granite-gray-light mt-2">Clique em "Gerar Relatório" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
