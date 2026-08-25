/**
 * Standalone fallback provider for SPAM_CONFIG.
 * Used if Script Properties are unreadable or empty.
 */
function getFallbackSpamConfig() {
  return {
    "settings": {
      "enableSpamCheck": true,
      "flagSubjectPrefix": "[SPAM] "
    },
    "categories": {
      "spam": [
        "casino", "viagra", "crypto", "bitcoin", "guest post",
        "backlinks", "seo services", "ranking #1", "whatsapp",
        "telegram", "investment opportunity", "make money online",
        "http://", "https://"
      ]
    }
  };
}