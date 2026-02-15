window.navigateTo = function (pageId) {
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');

    navItems.forEach(item => {
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    pageViews.forEach(view => {
        if (view.id === pageId) {
            view.classList.remove('hidden');
            view.classList.add('active');
        } else {
            view.classList.add('hidden');
            view.classList.remove('active');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
        document.body.classList.add('embed');
    }

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

    const createNewBtn = document.getElementById('create-new-btn');
    if (createNewBtn) {
        createNewBtn.addEventListener('click', () => {
            window.navigateTo('templates');
        });
    }

    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.navigateTo('dashboard');
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            if (window.renderTemplates) {
                window.renderTemplates(filter);
            }
        });
    });

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    if (!window.location.hash) {
        window.navigateTo('dashboard');
    }
});

