/**
 * KeywordChecker.gs
 * Scans individual strings OR field data objects for out-of-scope keywords.
 */

/**
 * Utility function to escape special Regex characters in keywords.
 */
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scans user input or submission field objects for out-of-scope keywords.
 * 
 * @param {string|Object} inputToScan - Single text string OR object containing submission fields.
 * @param {Object} [reviewConfig] - Optional explicit configuration object.
 * @returns {Object} { needsReview: boolean, matchedKeywords: string[], scannedFields: string[] }
 */
function checkReviewKeywords(inputToScan, reviewConfig) {
  const result = {
    needsReview: false,
    matchedKeywords: [],
    scannedFields: []
  };

  if (!inputToScan) return result;

  // 1. Fetch Configuration & Verify Review Flag
  const config = reviewConfig || getReviewConfig();
  if (config.settings && config.settings.enableReview === false) {
    return result;
  }

  const outOfScopeList = (config.categories && config.categories.outOfScope) 
    ? config.categories.outOfScope 
    : [];

  if (outOfScopeList.length === 0) return result;

  // 2. Safely extract all text recursively from nested objects or raw strings
  let combinedTextParts = [];

  function extractValues(obj) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string' || typeof obj === 'number') {
      combinedTextParts.push(String(obj));
    } else if (Array.isArray(obj)) {
      obj.forEach(item => extractValues(item));
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        result.scannedFields.push(key);
        extractValues(obj[key]);
      });
    }
  }

  if (typeof inputToScan === 'string') {
    combinedTextParts.push(inputToScan);
    result.scannedFields.push('rawText');
  } else if (typeof inputToScan === 'object') {
    extractValues(inputToScan);
  }

  const fullTextToScan = combinedTextParts.join(' ').toLowerCase();
  if (!fullTextToScan.trim()) return result;

  // 3. Match against out-of-scope keywords
  const matched = [];
  const uniqueKeywords = [...new Set(outOfScopeList.map(k => String(k).trim()))];

  for (const keyword of uniqueKeywords) {
    if (!keyword) continue;
    const cleanKw = keyword.toLowerCase();
    
    // Multi-word phrases use explicit string matching; single words use word boundaries (\b)
    const isMultiWord = cleanKw.includes(' ') || cleanKw.includes('-');
    const pattern = isMultiWord 
      ? escapeRegExp(cleanKw) 
      : '\\b' + escapeRegExp(cleanKw) + '\\b';

    const regex = new RegExp(pattern, 'i');
    if (regex.test(fullTextToScan)) {
      matched.push(keyword);
    }
  }

  result.needsReview = matched.length > 0;
  result.matchedKeywords = matched;

  return result;
}

/**
 * Loads REVIEW_CONFIG from Script Properties or falls back to getFallbackReviewConfig()
 */
function getReviewConfig() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('REVIEW_CONFIG');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger.log('Error parsing REVIEW_CONFIG: ' + e.message);
    }
  }
  return getFallbackReviewConfig();
}

/**
 * Fallback configuration in case REVIEW_CONFIG is missing from ScriptProperties.
 */
function getFallbackReviewConfig() {
  return {
    settings: {
      enableReview: true
    },
    categories: {
      outOfScope: [
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
 * TEST FUNCTION: Runs Review-Only test against AdminEmail template.
 */
function testAdminEmailReviewOnly() {
  const rawPayload = {
    submissionDate: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    client: {
      name: "Jane Doe (Review Test)",
      email: "jdoe@sample-inquiry.com",
      phone: "+1 (555) 014-9922",
      location: "450 Market Street, San Francisco, CA 94105",
      preferredContact: "Email",
      contactingAs: "Potential Client",
      isPreviousCustomer: false
    },
    request: {
      situation: "Help with TV panel display fault & Mobile phone battery",
      goal: "My TV panel has a display fault. Do you handle Xbox console hardware repairs or Mobile phone battery replacements?",
      timeframe: "Medium"
    }
  };

  const reviewResult = checkReviewKeywords(rawPayload, getFallbackReviewConfig());

  const secEval = {
    isSpam: false,
    requiresReview: reviewResult.needsReview,
    reviewFlags: reviewResult.matchedKeywords
  };

  const template = HtmlService.createTemplateFromFile('AdminEmail');
  template.submissionDate = rawPayload.submissionDate;
  template.client = rawPayload.client;
  template.request = rawPayload.request;
  template.secEval = secEval;

  const htmlBody = template.evaluate().getContent();
  const recipient = Session.getActiveUser().getEmail();

  MailApp.sendEmail({
    to: recipient,
    subject: "⚠️ TEST REVIEW ONLY: Out-of-Scope Keywords Detected",
    htmlBody: htmlBody
  });

  Logger.log("Review Test Executed.");
  Logger.log("Matched Keywords: " + JSON.stringify(reviewResult.matchedKeywords));
}