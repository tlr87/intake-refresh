/**
 * Standalone fallback provider for REVIEW_CONFIG.
 * Focuses exclusively on outOfScope filtering.
 */
function getFallbackReviewConfig() {
  return {
    "settings": {
      "enableReview": true,
      "targetField": "What Are You Trying To Achieve?",
      "flagSubjectPrefix": "[FLAGGED] "
    },
    "categories": {
      "outOfScope": [
        "TV", "Tuned", "Tv Tuned", "crypto", "seo", "guest post",
        "backlinks", "rankings", "partnership", "TV screen", "TV panel",
        "Display fault", "TV power failure", "Internal TV component",
        "Antenna", "TV reception", "Mobile phone screen", "Mobile phone battery",
        "Charging port", "Water damage", "Tablet screen", "Soldering",
        "Component-level electronics", "Console hardware", "PlayStation",
        "Xbox", "Nintendo", "Appliance", "Whiteware", "Electrical wiring",
        "General electronics", "Manufacturer warranty service"
      ]
    }
  };
}