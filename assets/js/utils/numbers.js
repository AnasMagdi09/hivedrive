// Utility functions for number formatting

/**
 * Convert Arabic-Indic numerals to Western Arabic numerals
 * @param {string} str - String containing Arabic numerals
 * @returns {string} String with Western numerals
 */
function toEnglishNumbers(str) {
    if (!str) return str;
    
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = String(str);
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(arabicNumbers[i], 'g'), englishNumbers[i]);
    }
    return result;
}

/**
 * Format number with English numerals
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

/**
 * Format currency with English numerals
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: 'ج.م')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'ج.م') {
    return formatNumber(amount, 2) + ' ' + currency;
}

/**
 * Format date with English numerals
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: 'en-GB')
 * @returns {string} Formatted date string
 */
function formatDate(date, locale = 'en-GB') {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale);
}

/**
 * Format datetime with English numerals
 * @param {string|Date} datetime - Datetime to format
 * @param {string} locale - Locale (default: 'en-GB')
 * @returns {string} Formatted datetime string
 */
function formatDateTime(datetime, locale = 'en-GB') {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleDateString(locale) + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Parse number from string (handles both Arabic and English numerals)
 * @param {string} str - String to parse
 * @returns {number} Parsed number
 */
function parseNumber(str) {
    const englishStr = toEnglishNumbers(str);
    return parseFloat(englishStr) || 0;
}

// Auto-convert all input fields on page load
document.addEventListener('DOMContentLoaded', function() {
    // Convert all number inputs to English on input
    document.addEventListener('input', function(e) {
        if (e.target.matches('input[type="number"], input[type="tel"], input[type="text"]')) {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = toEnglishNumbers(oldValue);
            
            if (oldValue !== newValue) {
                e.target.value = newValue;
                e.target.setSelectionRange(cursorPos, cursorPos);
            }
        }
    });
    
    // Convert all existing text content with numbers
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const nodesToConvert = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.nodeValue && /[٠-٩]/.test(node.nodeValue)) {
            nodesToConvert.push(node);
        }
    }
    
    nodesToConvert.forEach(node => {
        node.nodeValue = toEnglishNumbers(node.nodeValue);
    });
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.toEnglishNumbers = toEnglishNumbers;
    window.formatNumber = formatNumber;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.formatDateTime = formatDateTime;
    window.parseNumber = parseNumber;
}
