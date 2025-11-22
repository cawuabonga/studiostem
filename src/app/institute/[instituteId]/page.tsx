

import React from 'react';
import { getInstitute, getPrograms, getInstitutes, getNewsList } from '@/config/firebase';
import { notFound } from 'next/navigation';
import { InstitutePageView } from '@/components/institute/InstitutePageView';
import { Timestamp } from 'firebase/firestore';

export const revalidate = 60; // Revalidate every 60 seconds

async function getInstituteData(instituteId: string) {
    try {
        const [institute, programs, news] = await Promise.all([
            getInstitute(instituteId),
            getPrograms(instituteId),
            getNewsList(instituteId),
        ]);
        
        if (!institute) {
            return null;
        }

        // Convert Firestore Timestamps to strings before passing to client component
        const serializableNews = news.slice(0, 3).map(item => ({
            ...item,
            createdAt: (item.createdAt as Timestamp).toDate().toISOString(),
        }));


        return { institute, programs, news: serializableNews };
    } catch (error) {
        console.error("Error fetching institute page data:", error);
        return null;
    }
}

// This remains a Server Component to fetch data
export default async function InstitutePublicPage({ params }: { params: { instituteId: string } }) {
    const data = await getInstituteData(params.instituteId);

    if (!data) {
        notFound();
    }

    // We pass the fetched data as props to the new Client Component
    return <InstitutePageView {...data} />;
}

// Generate static paths for existing institutes
export async function generateStaticParams() {
  try {
    const institutes = await getInstitutes();
    return institutes.map(institute => ({
      instituteId: institute.id,
    }));
  } catch (error) {
    console.error("Could not generate static params for institutes:", error);
    return [];
  }
}
