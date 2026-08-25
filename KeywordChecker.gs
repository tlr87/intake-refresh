/**
 * Scans user input for out-of-scope keywords.
 * 
 * @param {string} textToScan - Input string to evaluate (e.g., userGoal).
 * @param {Object} [reviewConfig] - Optional explicit configuration object.
 * @returns {Object} { needsReview: boolean, matchedKeywords: string[] }
 */
function checkReviewKeywords(textToScan, reviewConfig) {
  const result = {
    needsReview: false,
    matchedKeywords: []
  };

  if (!textToScan) return result;

  const config = reviewConfig || getReviewConfig();
  if (config.settings && config.settings.enableReview === false) {
    return result;
  }

  const outOfScopeList = (config.categories && config.categories.outOfScope) 
    ? config.categories.outOfScope 
    : [];

  if (outOfScopeList.length === 0) return result;

  const textLower = textToScan.toLowerCase();
  const matched = [];
  const uniqueKeywords = [...new Set(outOfScopeList.map(k => String(k).toLowerCase()))];

  for (const keyword of uniqueKeywords) {
    const regex = new RegExp('\\b' + escapeRegExp(keyword) + '\\b', 'i');
    if (regex.test(textLower)) {
      matched.push(keyword);
    }
  }

  result.needsReview = matched.length > 0;
  result.matchedKeywords = matched;

  return result;
}

/**
 * Utility function to escape special Regex characters in keywords.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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