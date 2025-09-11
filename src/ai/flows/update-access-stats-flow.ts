
'use server';
/**
 * @fileOverview A Genkit flow that listens to new access logs and updates statistics.
 * This flow is triggered by Firestore events and is not meant to be called directly.
 */

import { ai } from '@/ai/genkit';
import { onDocument } from '@genkit-ai/firebase';
import { getFirestore, doc, runTransaction, Timestamp, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AccessLog, DailyStats, HourlyStats, OverallStats } from '@/types';
import { z } from 'zod';
import { format } from 'date-fns';

// Define the schema for the data that the trigger will pass to the flow.
// It includes the document data and the path parameters.
const AccessLogEventSchema = z.object({
  path: z.object({
    params: z.object({
      instituteId: z.string(),
      accessPointId: z.string(),
      logId: z.string(),
    }),
  }),
  data: z.any(), // We'll cast this to AccessLog inside the flow
});

// Define the flow without the trigger property
export const updateAccessStatsFlow = ai.defineFlow(
  {
    name: 'updateAccessStatsFlow',
    inputSchema: AccessLogEventSchema,
    outputSchema: z.void(),
  },
  async (eventData) => {
    // The data is now directly the content of the created document
    const logData = eventData.data as AccessLog;
    
    if (!logData.timestamp || !logData.status) {
        console.error('Missing required fields (timestamp, status) in log data.');
        return;
    }

    const { instituteId, accessPointId, logId } = eventData.path.params;

    if (!instituteId || !accessPointId || !logId) {
      console.error('Missing parameters from event trigger path.');
      return;
    }

    const statsCollectionRef = collection(
      db,
      'institutes',
      instituteId,
      'accessPoints',
      accessPointId,
      'statistics'
    );

    const today = format(logData.timestamp.toDate(), 'yyyy-MM-dd');
    const hourOfDay = format(logData.timestamp.toDate(), 'H'); // 0-23
    const userRole = logData.userRole || 'Desconocido';

    const dailyRef = doc(statsCollectionRef, `daily_${today}`);
    const hourlyRef = doc(statsCollectionRef, 'hourly_summary');
    const overallRef = doc(statsCollectionRef, 'overall');

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get current stats documents
        const [dailySnap, hourlySnap, overallSnap] = await Promise.all([
          transaction.get(dailyRef),
          transaction.get(hourlyRef),
          transaction.get(overallRef),
        ]);

        // 2. Prepare new stats data, initializing if documents don't exist
        const dailyStats: DailyStats = dailySnap.exists()
          ? (dailySnap.data() as DailyStats)
          : {
              id: today,
              total: 0,
              permitted: 0,
              denied: 0,
              byRole: {},
              byHour: {},
            };
        
        const hourlyStats: HourlyStats = hourlySnap.exists()
          ? (hourlySnap.data() as HourlyStats)
          : { id: 'summary', byHour: {} };

        const overallStats: OverallStats = overallSnap.exists()
          ? (overallSnap.data() as OverallStats)
          : {
              id: 'summary',
              total: 0,
              permitted: 0,
              denied: 0,
              firstAccess: null,
              lastAccess: null,
            };

        // 3. Update daily stats
        dailyStats.total += 1;
        dailyStats.byHour[hourOfDay] = (dailyStats.byHour[hourOfDay] || 0) + 1;
        dailyStats.byRole[userRole] = (dailyStats.byRole[userRole] || 0) + 1;
        if (logData.status === 'Permitido') {
          dailyStats.permitted += 1;
        } else {
          dailyStats.denied += 1;
        }

        // 4. Update hourly summary stats
        hourlyStats.byHour[hourOfDay] = (hourlyStats.byHour[hourOfDay] || 0) + 1;

        // 5. Update overall stats
        overallStats.total += 1;
        if (logData.status === 'Permitido') {
          overallStats.permitted += 1;
        } else {
          overallStats.denied += 1;
        }
        if (!overallStats.firstAccess) {
          overallStats.firstAccess = logData.timestamp!;
        }
        overallStats.lastAccess = logData.timestamp!;
        
        // 6. Write all updates back to Firestore in the transaction
        transaction.set(dailyRef, dailyStats);
        transaction.set(hourlyRef, hourlyStats);
        transaction.set(overallRef, overallStats);
      });
      console.log(`Successfully updated stats for access log ${logId}`);
    } catch (error) {
      console.error('Transaction failed: ', error);
      // Here you could add retry logic or log to an error reporting service
    }
  }
);

// Correct way to define a trigger for the flow
export const updateAccessStatsTrigger = onDocument({
    name: 'updateAccessStatsTrigger',
    collection: 'accessLogs',
    collectionGroup: true,
    flow: updateAccessStatsFlow,
});
