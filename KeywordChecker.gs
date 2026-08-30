
/**
 * ============================================================================
 * KeywordChecker.gs
 * ============================================================================
 *
 * Scans individual strings OR field data objects for out-of-scope keywords.
 *
 * REVIEW_CONFIG is loaded from Script Properties.
 * If unavailable, getFallbackReviewConfig() is provided by:
 *
 *     FallbackReviewConfig.gs
 *
 * That file is the single source of truth for the fallback configuration.
 * ============================================================================
 */


/**
 * ============================================================================
 * Escape special Regex characters
 * ============================================================================
 */
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


/**
 * ============================================================================
 * Check Review Keywords
 * ============================================================================
 *
 * Scans either:
 *
 *   - A single text string
 *   - An object containing submission fields
 *   - Nested objects / arrays
 *
 * Returns:
 *
 * {
 *   needsReview: boolean,
 *   matchedKeywords: string[],
 *   scannedFields: string[]
 * }
 *
 * @param {string|Object} inputToScan
 * @param {Object} [reviewConfig]
 * @returns {Object}
 */
function checkReviewKeywords(inputToScan, reviewConfig) {

  const result = {
    needsReview: false,
    matchedKeywords: [],
    scannedFields: []
  };


  // --------------------------------------------------------------------------
  // 1. Nothing to scan
  // --------------------------------------------------------------------------

  if (!inputToScan) {
    return result;
  }


  // --------------------------------------------------------------------------
  // 2. Load configuration
  // --------------------------------------------------------------------------

  const config =
    reviewConfig ||
    getReviewConfig();


  // --------------------------------------------------------------------------
  // 3. Check whether review checking is enabled
  // --------------------------------------------------------------------------

  if (
    config.settings &&
    config.settings.enableReview === false
  ) {
    return result;
  }


  // --------------------------------------------------------------------------
  // 4. Get out-of-scope keyword list
  // --------------------------------------------------------------------------

  const outOfScopeList =
    (
      config.categories &&
      Array.isArray(config.categories.outOfScope)
    )
      ? config.categories.outOfScope
      : [];


  if (outOfScopeList.length === 0) {
    return result;
  }


  // --------------------------------------------------------------------------
  // 5. Extract text recursively
  // --------------------------------------------------------------------------

  const combinedTextParts = [];


  function extractValues(obj) {

    if (
      obj === null ||
      obj === undefined
    ) {
      return;
    }


    // Strings and numbers are searchable values
    if (
      typeof obj === 'string' ||
      typeof obj === 'number'
    ) {

      combinedTextParts.push(
        String(obj)
      );

      return;
    }


    // Arrays may contain nested values
    if (Array.isArray(obj)) {

      obj.forEach(function (item) {
        extractValues(item);
      });

      return;
    }


    // Objects may contain nested fields
    if (typeof obj === 'object') {

      Object.keys(obj).forEach(function (key) {

        result.scannedFields.push(key);

        extractValues(
          obj[key]
        );

      });
    }
  }


  if (typeof inputToScan === 'string') {

    combinedTextParts.push(
      inputToScan
    );

    result.scannedFields.push(
      'rawText'
    );

  } else if (typeof inputToScan === 'object') {

    extractValues(
      inputToScan
    );
  }


  // --------------------------------------------------------------------------
  // 6. Combine searchable text
  // --------------------------------------------------------------------------

  const fullTextToScan =
    combinedTextParts
      .join(' ')
      .toLowerCase();


  if (!fullTextToScan.trim()) {
    return result;
  }


  // --------------------------------------------------------------------------
  // 7. Normalise and de-duplicate keywords
  // --------------------------------------------------------------------------

  const uniqueKeywords = [
    ...new Set(
      outOfScopeList
        .map(function (keyword) {
          return String(keyword).trim();
        })
        .filter(Boolean)
    )
  ];


  const matched = [];


  // --------------------------------------------------------------------------
  // 8. Match keywords
  // --------------------------------------------------------------------------

  for (const keyword of uniqueKeywords) {

    const cleanKw =
      keyword
        .toLowerCase()
        .trim();


    if (!cleanKw) {
      continue;
    }


    let pattern;


    /*
     * ------------------------------------------------------------------------
     * Multi-word / hyphenated phrases
     * ------------------------------------------------------------------------
     *
     * These variations are treated as equivalent:
     *
     *   TV panel
     *   TV  panel
     *   TV-panel
     *   TV - panel
     *   TV- panel
     *   TV -panel
     *
     * The phrase must still remain contiguous.
     */
    const isMultiWord =
      /\s/.test(cleanKw) ||
      cleanKw.includes('-');


    if (isMultiWord) {

      const words =
        cleanKw
          .split(/[\s-]+/)
          .filter(Boolean)
          .map(escapeRegExp);


      pattern =
        '\\b' +
        words.join('[\\s-]+') +
        '\\b';


    } else {

      /*
       * ----------------------------------------------------------------------
       * Single-word phrases
       * ----------------------------------------------------------------------
       *
       * Word boundaries prevent:
       *
       *   tv
       *
       * from matching:
       *
       *   activity
       *   television-related text where "tv" is only part of another word
       */
      pattern =
        '\\b' +
        escapeRegExp(cleanKw) +
        '\\b';
    }


    const regex =
      new RegExp(
        pattern,
        'i'
      );


    if (
      regex.test(fullTextToScan)
    ) {

      matched.push(
        keyword
      );
    }
  }


  // --------------------------------------------------------------------------
  // 9. Build final result
  // --------------------------------------------------------------------------

  result.needsReview =
    matched.length > 0;


  result.matchedKeywords =
    matched;


  return result;
}


/**
 * ============================================================================
 * Load REVIEW_CONFIG
 * ============================================================================
 *
 * Priority:
 *
 *   1. Script Properties → REVIEW_CONFIG
 *   2. FallbackReviewConfig.gs → getFallbackReviewConfig()
 *
 * The fallback configuration is deliberately NOT defined in this file.
 */
function getReviewConfig() {

  const props =
    PropertiesService
      .getScriptProperties();


  const raw =
    props.getProperty(
      'REVIEW_CONFIG'
    );


  if (raw) {

    try {

      return JSON.parse(
        raw
      );

    } catch (e) {

      Logger.log(
        'Error parsing REVIEW_CONFIG: ' +
        e.message
      );
    }
  }


  return getFallbackReviewConfig();
}

