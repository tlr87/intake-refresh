/**
 * ============================================================================
 * RD3 TECH — CONFIG EDITOR & STANDALONE FALLBACK PROVIDERS
 * ============================================================================
 */

function openConfigEditor() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialDataJson = JSON.stringify(getInitialData());
  
  const htmlOutput = template.evaluate()
    .setWidth(920)
    .setHeight(720)
    .setTitle('RD3 Tech — Configuration JSON Editor');

  try {
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'RD3 Tech Config Editor');
  } catch(e) {
    return htmlOutput;
  }
}

/**
 * Reads existing Script Properties WITHOUT wiping or auto-writing fallback defaults.
 */
function getInitialData() {
  const store = PropertiesService.getScriptProperties();
  const rawProps = store.getProperties() || {};
  
  const fallbacks = {
    REVIEW_CONFIG: getFallbackReviewConfig(),
    URGENCY_CONFIG: getUrgencyConfigFallback(),
    SPAM_CONFIG: getFallbackSpamConfig(),
    RATE_LIMIT_CONFIG: getFallbackRateLimitConfig(),
    FORM_CONFIG: getFallbackFormConfig()
  };

  const parsedMap = {};

  // 1. Process all existing Script Properties
  Object.keys(rawProps).forEach(key => {
    try {
      parsedMap[key] = JSON.parse(rawProps[key]);
    } catch (e) {
      parsedMap[key] = rawProps[key];
    }
  });

  // 2. Supply fallbacks in-memory ONLY if key doesn't exist in Script Properties
  Object.keys(fallbacks).forEach(key => {
    if (!(key in parsedMap)) {
      parsedMap[key] = fallbacks[key];
    }
  });

  return parsedMap;
}

/**
 * Saves specific properties directly without calling deleteAllProperties().
 */
function saveAllConfigs(payload) {
  const store = PropertiesService.getScriptProperties();
  
  Object.keys(payload).forEach(key => {
    const val = typeof payload[key] === 'string' ? payload[key] : JSON.stringify(payload[key]);
    store.setProperty(key, val);
  });
  
  return true;
}

/**
 * RESTORE HANDLER: Executes explicit fallback functions and updates Script Properties.
 */
function resetKeyToFallback(key) {
  var fallbackData = null;

  if (key === 'REVIEW_CONFIG') {
    fallbackData = getFallbackReviewConfig();
  } else if (key === 'URGENCY_CONFIG') {
    fallbackData = getUrgencyConfigFallback();
  } else if (key === 'SPAM_CONFIG') {
    fallbackData = getFallbackSpamConfig();
  } else if (key === 'RATE_LIMIT_CONFIG') {
    fallbackData = getFallbackRateLimitConfig();
  } else if (key === 'FORM_CONFIG') {
    fallbackData = getFallbackFormConfig();
  }

  if (fallbackData) {
    // Write full fallback payload directly to Script Properties
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(fallbackData));
    // Pass back raw JSON string to eliminate RPC serialization drops
    return JSON.stringify(fallbackData);
  }

  throw new Error("No fallback provider defined for key: " + key);
}

/* =========================================================================
 * YOUR STANDALONE FALLBACK PROVIDER FUNCTIONS
 * ========================================================================= */

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
        "tv", "TV", "Tuned", "Tv Tuned", "crypto", "seo", "guest post",
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

/**
 * Standalone fallback provider for RATE_LIMIT_CONFIG.
 * Provides rate limit bounds for submission processing.
 */
function getFallbackRateLimitConfig() {
  return {
    "settings": {
      "enableRateLimiting": true,
      "maxSubmissionsPerWindow": 5,
      "windowMinutes": 60,
      "lockoutMinutes": 120
    }
  };
}

/**
 * Standalone fallback provider for FORM_CONFIG.
 */
function getFallbackFormConfig() {
  return {
    "settings": {
      "adminEmail": "tom@rd3tech.com",
      "formTitle": "RD3 Tech Contact Form",
      "formBaseUrl": "https://docs.google.com/forms/d/e/1FAIpQLSevC9HvM8eo7dCKQzU6FUby03Khtiis_ptiiVsCxWn0__ulPA/viewform"
    },
    "fields": {
      "honeypot": {
        "titleMatch": "Security Check",
        "entryId": "entry.313042228",
        "type": "text"
      },
      "name": {
        "titleMatch": "Name",
        "entryId": "entry.776532163",
        "type": "text"
      },
      "email": {
        "titleMatch": "Email",
        "entryId": "entry.1530707551",
        "type": "text"
      },
      "phone": {
        "titleMatch": "Phone",
        "entryId": "entry.2118395637",
        "type": "text"
      },
      "contactPreference": {
        "titleMatch": "How would you prefer us to contact you?",
        "entryId": "entry.1955012690",
        "type": "multiple_choice"
      },
      "usedBefore": {
        "titleMatch": "Have you used RD3 Tech before?",
        "entryId": "entry.1871615748",
        "type": "multiple_choice"
      },
      "clientType": {
        "titleMatch": "contacting RD3 Tech as",
        "entryId": "entry.480241942",
        "type": "multiple_choice"
      },
      "helpCategory": {
        "titleMatch": "What can we help you with?",
        "entryId": "entry.1402987091",
        "type": "checkbox"
      },
      "userGoal": {
        "titleMatch": "What Are You Trying To Achieve?",
        "entryId": "entry.785917515",
        "type": "paragraph"
      },
      "urgency": {
        "titleMatch": "How Urgent Is This For You?",
        "entryId": "entry.790093298",
        "type": "multiple_choice"
      }
    }
  };
}

/* =========================================================================
 * WEB APP ROUTER
 * ========================================================================= */

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.initialDataJson = JSON.stringify(getInitialData());

  return template.evaluate()
    .setWidth(920)
    .setHeight(720)
    .setTitle('RD3 Tech — Configuration JSON Editor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}