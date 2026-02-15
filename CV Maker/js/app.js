// Global Navigation Function
window.navigateTo = function (pageId) {
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');

    // Update Nav (only if it's a menu item)
    navItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Show Page
    pageViews.forEach(view => {
        if (view.id === pageId) {
            view.classList.remove('hidden');
            view.classList.add('active');
        } else {
            view.classList.add('hidden');
            view.classList.remove('active');
        }
    });

    // Specific logic for Editor
    if (pageId === 'editor') {
        const sidebar = document.querySelector('.sidebar');
        // Optional: Collapse sidebar in editor mode for more space
        // sidebar.classList.add('collapsed');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Handling
    const navItems = document.querySelectorAll('.nav-item');
    const viewAllLinks = document.querySelectorAll('.view-all');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = item.dataset.page;
            window.navigateTo(pageId);
        });
    });

    viewAllLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            window.navigateTo(target);
        });
    });

    // Create New Button
    const createNewBtn = document.getElementById('create-new-btn');
    if (createNewBtn) {
        createNewBtn.addEventListener('click', () => {
            window.navigateTo('templates');
        });
    }

    // Back to Dashboard from Editor
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.navigateTo('dashboard');
        });
    }

    // Filter Handling
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class
            btn.classList.add('active');

            // Filter logic will be connected to templates.js render function
            const filter = btn.dataset.filter;
            if (window.renderTemplates) {
                window.renderTemplates(filter);
            }
        });
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Ensure Dashboard is visible on load if no hash
    if (!window.location.hash) {
        window.navigateTo('dashboard');
    }
});
