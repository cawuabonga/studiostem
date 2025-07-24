
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LinkProfileDialog } from '@/components/profile/LinkProfileDialog';

export default function LinkProfilePage() {
    const { reloadUser } = useAuth();

    // The dialog is controlled internally now for simplicity on this dedicated page.
    const [isDialogOpen, setIsDialogOpen] = useState(true);

    const handleProfileLinked = async () => {
        await reloadUser();
        // After linking, the AuthContext will update, and the layout's useEffect 
        // will redirect the user to their correct dashboard.
        // We can simply close the dialog.
        setIsDialogOpen(false);
        // The user will be automatically redirected by the logic in other pages
        // (like /dashboard/page.tsx) once their role and data are updated.
    };

    return (
        <LinkProfileDialog
            isOpen={isDialogOpen}
            // We pass a dummy onClose because on this page, the dialog should not be closable
            // without completing the action. The user will be "stuck" here until they link.
            onClose={() => {}} 
            onProfileLinked={handleProfileLinked}
            isModal={false} // Render it as part of the page content, not as a modal overlay
        />
    );
}

