/**
 * Admin Triage Script
 * This script checks the user's role and redirects them to the appropriate admin page.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Ensure AuthUtils is loaded
    if (typeof AuthUtils === 'undefined') {
        console.error('AuthUtils not loaded. Cannot perform triage.');
        // Optionally redirect to an error page or home
        window.location.href = '/home.html?reason=error';
        return;
    }

    const isSuperAdmin = AuthUtils.hasRole('super-admin');
    const isUserAdmin = AuthUtils.hasRole('user-admin');

    if (isSuperAdmin) {
        // Super-admins (including those who are also user-admins) go to the full admin page.
        console.log('Super-admin detected. Redirecting to full admin page.');
        window.location.href = '/admin/index.html';
    } else if (isUserAdmin) {
        // Users who are only user-admins go to the pared-back user-admin page.
        console.log('User-admin detected. Redirecting to user-admin page.');
        window.location.href = '/user-admin/index.html';
    } else {
        // All other users are not authorized and are sent back to the home page.
        console.log('Non-admin user detected. Redirecting to home.');
        window.location.href = '/home.html?reason=unauthorized';
    }
});
