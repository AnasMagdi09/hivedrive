/**
 * HiveDrive - Internationalization (i18n) System
 */

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'ar';
        this.translations = window.translations || {};
    }

    /**
     * Get translation by key
     */
    t(key, params = {}) {
        const lang = this.translations[this.currentLang] || this.translations['ar'];
        let text = lang[key] || key;

        // Replace parameters
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);

        // Update document direction
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

        // Dispatch event for components to update
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    /**
     * Get current language
     */
    getLanguage() {
        return this.currentLang;
    }

    /**
     * Check if current language is RTL
     */
    isRTL() {
        return this.currentLang === 'ar';
    }

    /**
     * Initialize i18n
     */
    init() {
        this.setLanguage(this.currentLang);
    }

    /**
     * Toggle language
     */
    toggleLanguage() {
        const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
        this.setLanguage(newLang);
        return newLang;
    }
}

// Create global instance
window.i18n = new I18n();

// Shorthand function
window.t = (key, params) => window.i18n.t(key, params);
