/**
 * Standalone fallback provider for URGENCY_CONFIG.
 * Used if Script Properties are unreadable or empty.
 */
function getUrgencyConfigFallback() {
  return {
    "levels": ["Low", "Medium", "High"],
    "defaultLevel": "Medium"
  };
}