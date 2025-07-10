
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirectPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (user) {
            switch (user.role) {
                case 'Admin':
                case 'Coordinator':
                    // Redirect to a general academic or admin page if one exists
                    router.push('/dashboard/academic/reports');
                    break;
                case 'Teacher':
                    // Redirect to a teacher-specific dashboard
                    router.push('/dashboard/student'); // Placeholder, adjust as needed
                    break;
                case 'Student':
                    // Redirect to a student-specific dashboard
                    router.push('/dashboard/student');
                    break;
                default:
                    // Fallback to a generic welcome page
                    router.push('/dashboard/student');
                    break;
            }
        } else {
            // If no user, redirect to login
            router.push('/');
        }
    }, [user, loading, router]);

    // Render a loading state while redirecting
    return (
        <div className="flex justify-center items-center h-full">
            <p>Cargando dashboard...</p>
        </div>
    );
}
