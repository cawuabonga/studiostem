

import React from 'react';
import { getInstitute, getPrograms, getInstitutes, getNewsList } from '@/config/firebase';
import { notFound } from 'next/navigation';
import { InstitutePageView } from '@/components/institute/InstitutePageView';

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

        return { institute, programs, news: news.slice(0, 3) }; // Return only the 3 latest news
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
