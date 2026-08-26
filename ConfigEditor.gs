/**
 * ============================================================================
 * RD3 TECH — CONFIG EDITOR, ROUTER & STANDALONE FALLBACK PROVIDERS
 * ============================================================================
 */

/**
 * Creates a custom UI Menu inside Google Sheets to launch the editor.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('RD3 Tech')
    .addItem('⚙️ Open Config Editor', 'openConfigEditor')
    .addToUi();
}

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

/**
 * HELPER: Direct Script Properties Wipe and Reset.
 * Run this directly from the Apps Script editor to reset all Script Properties to default.
 */
function resetAllScriptPropertiesToDefault() {
  const store = PropertiesService.getScriptProperties();
  store.deleteAllProperties();
  
  const defaults = {
    REVIEW_CONFIG: getFallbackReviewConfig(),
    URGENCY_CONFIG: getUrgencyConfigFallback(),
    SPAM_CONFIG: getFallbackSpamConfig(),
    RATE_LIMIT_CONFIG: getFallbackRateLimitConfig(),
    FORM_CONFIG: getFallbackFormConfig()
  };

  Object.keys(defaults).forEach(key => {
    store.setProperty(key, JSON.stringify(defaults[key]));
  });

  Logger.log("✔ All Script Properties cleared and re-populated with defaults!");
}

/**
 * VALIDATION HANDLER: Validates configured form items against the live Google Form.
 */
function runFormValidationFromUi() {
  const details = [];
  let totalConfigured = 0;
  let passed = 0;
  let failed = 0;
  let unaccounted = 0;

  try {
    const data = getInitialData();
    const formConfig = data.FORM_CONFIG || getFallbackFormConfig();
    const fields = formConfig.fields || {};
    const formUrl = formConfig.settings ? formConfig.settings.formBaseUrl : '';

    if (!formUrl) {
      throw new Error("No formBaseUrl configured in FORM_CONFIG settings.");
    }

    // Extract Form ID from the URL string
    const match = formUrl.match(/\/d\/e\/([^\/]+)\/viewform/) || formUrl.match(/\/d\/([^\/]+)/);
    if (!match) {
      throw new Error("Could not parse Form ID from formBaseUrl.");
    }

    let form;
    try {
      form = FormApp.openById(match[1]);
    } catch(err) {
      throw new Error("Unable to open Google Form. Verify the Form ID and script permissions.");
    }

    const liveItems = form.getItems();
    const liveItemTitles = liveItems.map(item => item.getTitle().trim().toLowerCase());
    const configuredKeys = Object.keys(fields);
    totalConfigured = configuredKeys.length;

    details.push("--- CONFIGURATION VERIFICATION ---");
    configuredKeys.forEach(key => {
      const field = fields[key];
      const matchTitle = (field.titleMatch || '').trim().toLowerCase();

      const foundInLive = liveItemTitles.some(title => title.includes(matchTitle));
      if (foundInLive) {
        passed++;
        details.push("✔ PASS [" + key + "]: Matched title pattern \"" + field.titleMatch + "\"");
      } else {
        failed++;
        details.push("✖ FAIL [" + key + "]: Title pattern \"" + field.titleMatch + "\" not found in live form");
      }
    });

    details.push("\n--- UNACCOUNTED LIVE FORM ITEMS ---");
    liveItems.forEach(item => {
      const title = item.getTitle();
      const titleLower = title.trim().toLowerCase();
      const isConfigured = configuredKeys.some(key => {
        const matchTitle = (fields[key].titleMatch || '').trim().toLowerCase();
        return titleLower.includes(matchTitle);
      });

      if (!isConfigured) {
        unaccounted++;
        details.push("⚠️ UNACCOUNTED: Live Form item \"" + title + "\" (ID: " + item.getId() + ") is not in config.");
      }
    });

  } catch (err) {
    details.push("ERROR: " + err.message);
    failed = totalConfigured;
  }

  return {
    totalConfigured: totalConfigured,
    passed: passed,
    failed: failed,
    unaccounted: unaccounted,
    details: details
  };
}

/* =========================================================================
 * KEYWORD EVALUATION ENGINE HANDLERS
 * ========================================================================= */

/**
 * Evaluates text against configured out-of-scope review keywords using regex word boundaries.
 */
function checkReviewKeywords(text, config) {
  if (!text || !config || !config.settings || !config.settings.enableReview) {
    return { needsReview: false, matchedKeywords: [] };
  }
  
  const keywords = config.categories ? config.categories.outOfScope || [] : [];
  const matched = [];
  
  keywords.forEach(kw => {
    const escapedKw = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('\\b' + escapedKw + '\\b', 'i');
    if (pattern.test(text)) {
      matched.push(kw);
    }
  });

  return {
    needsReview: matched.length > 0,
    matchedKeywords: matched
  };
}

/**
 * Evaluates text against configured spam keywords.
 */
function checkSpamKeywords(text, config) {
  if (!text || !config || !config.settings || !config.settings.enableSpamCheck) {
    return { isSpam: false, matchedKeywords: [] };
  }

  const keywords = config.categories ? config.categories.spam || [] : [];
  const matched = [];

  keywords.forEach(kw => {
    const lowerKw = kw.toLowerCase().trim();
    const lowerText = text.toLowerCase();
    
    if (lowerKw.startsWith('http')) {
      if (lowerText.includes(lowerKw)) {
        matched.push(kw);
      }
    } else {
      const escapedKw = lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp('\\b' + escapedKw + '\\b', 'i');
      if (pattern.test(lowerText)) {
        matched.push(kw);
      }
    }
  });

  return {
    isSpam: matched.length > 0,
    matchedKeywords: matched
  };
}

/* =========================================================================
 * STANDALONE FALLBACK PROVIDER FUNCTIONS
 * ========================================================================= */

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

function getUrgencyConfigFallback() {
  return {
    "levels": ["Low", "Medium", "High"],
    "defaultLevel": "Medium"
  };
}

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

function getFallbackFormConfig() {
  return {
    "settings": {
      "adminEmail": "tom@rd3tech.com",
      "formTitle": "RD3 Tech Contact Form",
      "formBaseUrl": "https://docs.google.com/forms/d/e/1FAIpQLSevC9HvM8eo7dCKQzU6FUby03Khtiis_ptiiVsCxWn0__ulPA/viewform"
    },
    "fields": {
      "honeypot": {
        "titleMatch": "security check",
        "entryId": "entry.313042228",
        "type": "text"
      },
      "name": {
        "titleMatch": "name",
        "entryId": "entry.776532163",
        "type": "text"
      },
      "email": {
        "titleMatch": "email",
        "entryId": "entry.1530707551",
        "type": "text"
      },
      "phone": {
        "titleMatch": "phone",
        "entryId": "entry.2118395637",
        "type": "text"
      },
      "address": {
        "titleMatch": "address / location",
        "entryId": "entry.XXXXXXXXX",
        "type": "text"
      },
      "contactPreference": {
        "titleMatch": "how would you prefer us to contact you?",
        "entryId": "entry.1955012690",
        "type": "multiple_choice"
      },
      "usedBefore": {
        "titleMatch": "have you used rd3 tech before?",
        "entryId": "entry.1871615748",
        "type": "multiple_choice"
      },
      "clientType": {
        "titleMatch": "contacting rd3 tech as",
        "entryId": "entry.480241942",
        "type": "multiple_choice"
      },
      "helpCategory": {
        "titleMatch": "what can we help you with?",
        "entryId": "entry.1402987091",
        "type": "checkbox"
      },
      "userGoal": {
        "titleMatch": "what are you trying to achieve?",
        "entryId": "entry.785917515",
        "type": "paragraph"
      },
      "urgency": {
        "titleMatch": "how urgent is this for you?",
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
  const isApiRequest = e && e.parameter && 
                       (e.parameter.api === 'true' || e.parameter.mode === 'api');

  if (isApiRequest) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "active",
      "service": "RD3 Tech Web App API"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const userEmail = Session.getActiveUser().getEmail();
  const allowedUsers = [
    "tom@rd3tech.com",
    "tom.revill@gmail.com"
  ];

  if (allowedUsers.length > 0 && allowedUsers.indexOf(userEmail) === -1) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif; padding:20px; color:#ef4444; background:#0f172a; height:100vh;'>" +
        "<h2>🚫 Access Denied</h2>" +
        "<p>User <b>" + (userEmail || "Anonymous") + "</b> is not authorized to access this configuration editor.</p>" +
      "</div>"
    );
  }

  const template = HtmlService.createTemplateFromFile('Index');
  template.initialDataJson = JSON.stringify(getInitialData());

  return template.evaluate()
    .setWidth(920)
    .setHeight(720)
    .setTitle('RD3 Tech — Configuration JSON Editor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * CONSOLE TEST ROUTER
 */
function testDoGetRouting() {
  const result = doGet({});
  
  Logger.log("=== DOGET TEST RESULT ===");
  Logger.log("Content Type: " + result.getContent());
  
  if (result.getContent().indexOf("RD3 Tech Web App API") !== -1) {
    Logger.log("❌ CRITICAL: doGet is hitting an old API handler or duplicate function!");
  } else if (result.getContent().indexOf("Access Denied") !== -1) {
    Logger.log("⚠️ Access Denied triggered (Session email empty in test execution context). UI code path is ACTIVE.");
  } else {
    Logger.log("✔ SUCCESS: doGet successfully returned the HTML Config Editor UI!");
  }
}