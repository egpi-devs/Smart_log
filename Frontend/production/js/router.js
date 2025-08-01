// ──────────────────────────────────────────────
//  Simple SPA Router
// ──────────────────────────────────────────────

const Router = {
    currentPage: null,

    navigate(page) {
        this.currentPage = page;
        window.location.hash = page;
        App.render();
    },

    getPage() {
        const hash = window.location.hash.slice(1) || 'welcome';
        // const hash = window.location.hash.slice(1) || 'login';
        return hash;
    },

    init() {
        window.addEventListener('hashchange', () => App.render());
    }
};
