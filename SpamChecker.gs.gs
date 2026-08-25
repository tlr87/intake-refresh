/**
 * Evaluates text specifically against Spam rules.
 * Uses KeywordChecker.gs matching logic under the hood.
 * 
 * @param {string} textToScan - Input string to evaluate.
 * @param {Object} [spamConfig] - Optional explicit configuration object.
 * @returns {Object} { isSpam: boolean, matchedKeywords: string[] }
 */
function checkSpamKeywords(textToScan, spamConfig) {
  const config = spamConfig || getSpamConfig();

  if (config.settings && config.settings.enableSpamCheck === false) {
    return { isSpam: false, matchedKeywords: [] };
  }

  // Remap spam categories to work seamlessly with checkReviewKeywords logic
  const reviewFormatConfig = {
    settings: { enableReview: true },
    categories: {
      outOfScope: (config.categories && config.categories.spam) ? config.categories.spam : []
    }
  };

  const result = checkReviewKeywords(textToScan, reviewFormatConfig);

  return {
    isSpam: result.needsReview,
    matchedKeywords: result.matchedKeywords
  };
}

/**
 * Loads SPAM_CONFIG from Script Properties or falls back to FallbackSpamConfig.gs.
 */
function getSpamConfig() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('SPAM_CONFIG');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger.log('Error parsing SPAM_CONFIG: ' + e.message);
    }
  }
  return getFallbackSpamConfig();
}