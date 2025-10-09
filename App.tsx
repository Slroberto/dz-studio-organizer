import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { AddOrderModal } from './components/AddOrderModal';
import { EditOrderModal } from './components/EditOrderModal';
import { GalleryPage } from './components/GalleryPage';
import { GalleryDetailModal } from './components/GalleryDetailModal';
import { NotificationContainer } from './components/NotificationContainer';
import { DailySummaryModal } from './components/DailySummaryModal';
…       <NotificationContainer onNotificationClick={handleNotificationClick} />
      {/* {isSummaryModalOpen && dailySummaryData && (
        <DailySummaryModal 
            summary={dailySummaryData}
            onClose={() => setIsSummaryModalOpen(false)}
        />
      )} */}
    </div>
  );
}
