import React, { lazy, Suspense } from 'react';
import { Loader } from 'lucide-react';

const ReportsPage = lazy(() => import('./ReportsPage').then(module => ({ default: module.ReportsPage })));

export const AnalysisPage: React.FC = () => {
    const suspenseFallback = (
        <div className="flex h-full w-full items-center justify-center">
            <Loader className="animate-spin text-cadmium-yellow" size={48} />
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <Suspense fallback={suspenseFallback}>
                <ReportsPage />
            </Suspense>
        </div>
    );
};
