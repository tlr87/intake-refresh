
/**
 * ============================================================================
 * RD3 TECH — CONFIG FALLBACK PROVIDERS & KEYWORD ENGINES
 * ============================================================================
 *
 * This file contains:
 *
 *   - Review configuration fallback
 *   - Urgency configuration fallback
 *   - Spam configuration fallback
 *   - Rate-limit configuration fallback
 *   - Review keyword evaluation
 *   - Spam keyword evaluation
 *
 * FIELD_SCHEMA fallback remains here because it is a configuration provider.
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * REVIEW CONFIG FALLBACK
 * ============================================================================
 */
function getFallbackReviewConfig() {

  return {

    settings: {

      enableReview:
        true,

      targetField:
        'What Are You Trying To Achieve?',

      flagSubjectPrefix:
        '[FLAGGED] '

    },

    categories: {

      outOfScope: [

        'tv',
        'TV',
        'Tuned',
        'Tv Tuned',
        'crypto',
        'seo',
        'guest post',
        'backlinks',
        'rankings',
        'partnership',
        'TV screen',
        'TV panel',
        'Display fault',
        'TV power failure',
        'Internal TV component',
        'Antenna',
        'TV reception',
        'Mobile phone screen',
        'Mobile phone battery',
        'Charging port',
        'Water damage',
        'Tablet screen',
        'Soldering',
        'Component-level electronics',
        'Console hardware',
        'PlayStation',
        'Xbox',
        'Nintendo',
        'Appliance',
        'Whiteware',
        'Electrical wiring',
        'General electronics',
        'Manufacturer warranty service'

      ]

    }

  };

}


/**
 * ============================================================================
 * URGENCY CONFIG FALLBACK
 * ============================================================================
 */
function getUrgencyConfigFallback() {

  return {

    levels: [

      'Low',
      'Medium',
      'High'

    ],

    defaultLevel:
      'Medium'

  };

}


/**
 * ============================================================================
 * SPAM CONFIG FALLBACK
 * ============================================================================
 */
function getFallbackSpamConfig() {

  return {

    settings: {

      enableSpamCheck:
        true,

      flagSubjectPrefix:
        '[SPAM] '

    },

    categories: {

      spam: [

        'casino',
        'viagra',
        'crypto',
        'bitcoin',
        'guest post',
        'backlinks',
        'seo services',
        'ranking #1',
        'whatsapp',
        'telegram',
        'investment opportunity',
        'make money online',
        'http://',
        'https://'

      ]

    }

  };

}


/**
 * ============================================================================
 * RATE LIMIT CONFIG FALLBACK
 * ============================================================================
 */
function getFallbackRateLimitConfig() {

  return {

    settings: {

      enableRateLimiting:
        true,

      maxSubmissionsPerWindow:
        5,

      windowMinutes:
        60,

      lockoutMinutes:
        120

    }

  };

}


/**
 * ============================================================================
 * REVIEW KEYWORD EVALUATION
 * ============================================================================
 */
function checkReviewKeywords(text, config) {

  if (
    !text ||
    !config ||
    !config.settings ||
    !config.settings.enableReview
  ) {

    return {

      needsReview:
        false,

      matchedKeywords:
        []

    };

  }


  const keywords =
    config.categories
      ? config.categories.outOfScope || []
      : [];


  const matched = [];


  keywords.forEach(function(kw) {

    if (
      typeof kw !== 'string' ||
      !kw.trim()
    ) {

      return;

    }


    const escapedKw =
      kw.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const pattern =
      new RegExp(
        '\\b' +
        escapedKw +
        '\\b',
        'i'
      );


    if (pattern.test(text)) {

      matched.push(kw);

    }

  });


  return {

    needsReview:
      matched.length > 0,

    matchedKeywords:
      matched

  };

}


/**
 * ============================================================================
 * SPAM KEYWORD EVALUATION
 * ============================================================================
 */
function checkSpamKeywords(text, config) {

  if (
    !text ||
    !config ||
    !config.settings ||
    !config.settings.enableSpamCheck
  ) {

    return {

      isSpam:
        false,

      matchedKeywords:
        []

    };

  }


  const keywords =
    config.categories
      ? config.categories.spam || []
      : [];


  const matched = [];


  const lowerText =
    String(text).toLowerCase();


  keywords.forEach(function(kw) {

    if (
      typeof kw !== 'string' ||
      !kw.trim()
    ) {

      return;

    }


    const lowerKw =
      kw.toLowerCase().trim();


    if (
      lowerKw.startsWith('http')
    ) {

      if (
        lowerText.includes(lowerKw)
      ) {

        matched.push(kw);

      }

      return;

    }


    const escapedKw =
      lowerKw.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const pattern =
      new RegExp(
        '\\b' +
        escapedKw +
        '\\b',
        'i'
      );


    if (
      pattern.test(lowerText)
    ) {

      matched.push(kw);

    }

  });


  return {

    isSpam:
      matched.length > 0,

    matchedKeywords:
      matched

  };

}