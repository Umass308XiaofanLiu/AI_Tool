// ==================== Main Application ====================

const App = {
    init() {
        // Initialize theme first
        ThemeManager.init();

        // Initialize components
        ChatHistory.init();
        Sidebar.init();
        ChatUI.init();
        SettingsDialog.init();

        console.log('AI Chat Client initialized');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
