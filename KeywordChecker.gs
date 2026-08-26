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

  // 2. Safely extract text string from any input type
  let combinedTextParts = [];

  if (typeof inputToScan === 'string') {
    combinedTextParts.push(inputToScan);
    result.scannedFields.push('rawText');
  } else if (typeof inputToScan === 'object') {
    const targetKeys = ['name', 'email', 'phone', 'address', 'userGoal', 'helpCategory', 'details'];
    
    targetKeys.forEach(key => {
      if (inputToScan[key] !== undefined && inputToScan[key] !== null) {
        const val = inputToScan[key];
        if (Array.isArray(val)) {
          combinedTextParts.push(val.join(' '));
        } else {
          combinedTextParts.push(String(val));
        }
        result.scannedFields.push(key);
      }
    });

    // Fallback: iterate over all properties if no priority keys matched
    if (combinedTextParts.length === 0) {
      Object.keys(inputToScan).forEach(key => {
        const val = inputToScan[key];
        if (val !== undefined && val !== null) {
          combinedTextParts.push(Array.isArray(val) ? val.join(' ') : String(val));
          result.scannedFields.push(key);
        }
      });
    }
  }

  const fullTextToScan = combinedTextParts.join(' ').toLowerCase();
  if (!fullTextToScan.trim()) return result;

  // 3. Match against out-of-scope keywords
  const matched = [];
  const uniqueKeywords = [...new Set(outOfScopeList.map(k => String(k).toLowerCase()))];

  for (const keyword of uniqueKeywords) {
    const regex = new RegExp('\\b' + escapeRegExp(keyword) + '\\b', 'i');
    if (regex.test(fullTextToScan)) {
      matched.push(keyword);
    }
  }

  result.needsReview = matched.length > 0;
  result.matchedKeywords = matched;

  return result;
}

/**
 * Loads REVIEW_CONFIG from Script Properties or falls back to FallbackReviewConfig.gs
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
        "crypto",
        "bitcoin",
        "forex",
        "gambling",
        "seo audit",
        "web scraping",
        "hacking"
      ]
    }
  };
}