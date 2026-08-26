/**
 * SpamFilter.gs
 * Complete security engine combining honeypot detection, keyword matching,
 * disposable email checks, TLD filtering, and strict phone/contact validation.
 */

/**
 * Evaluates contact inputs and honeypot values against SPAM_CONFIG.
 * 
 * @param {string|Object} inputToScan - Single string OR submission object containing contact fields.
 * @param {Object} [spamConfig] - Optional explicit configuration object.
 * @returns {Object} { isSpam: boolean, matchedKeywords: string[], reasons: string[] }
 */
function checkSpamKeywords(inputToScan, spamConfig) {
  const result = {
    isSpam: false,
    matchedKeywords: [],
    reasons: []
  };

  if (!inputToScan) return result;

  const config = spamConfig || getSpamConfig();
  if (config.settings && config.settings.enableSpamCheck === false) {
    return result;
  }

  // 1. HONEYPOT TRAP CHECK
  if (typeof inputToScan === 'object' && inputToScan.honeypot) {
    if (checkHoneypot(inputToScan.honeypot)) {
      result.isSpam = true;
      result.matchedKeywords.push('honeypot_trap');
      result.reasons.push('Honeypot field was populated by bot');
      return result;
    }
  }

  // 2. KEYWORD MATCHING (Delegates to KeywordChecker)
  const spamKeywords = (config.categories && config.categories.spam) ? config.categories.spam : [];
  const reviewFormatConfig = {
    settings: { enableReview: true },
    categories: { outOfScope: spamKeywords }
  };

  const keywordResult = checkReviewKeywords(inputToScan, reviewFormatConfig);
  if (keywordResult.needsReview) {
    result.matchedKeywords.push(...keywordResult.matchedKeywords);
    result.reasons.push('Matched spam keyword(s): ' + keywordResult.matchedKeywords.join(', '));
  }

  // 3. CONTACT FIELD STRUCTURAL & PATTERN VALIDATION
  if (typeof inputToScan === 'object') {
    const name = String(inputToScan.name || '').trim();
    const email = String(inputToScan.email || '').trim().toLowerCase();
    const phone = String(inputToScan.phone || '').trim();
    const address = String(inputToScan.address || '').trim();
    const emailDomain = email.includes('@') ? email.split('@')[1] : '';

    // A. Disposable Domain Check
    if (config.settings.blockDisposableEmails !== false && config.disposableDomains) {
      if (config.disposableDomains.includes(emailDomain)) {
        result.matchedKeywords.push(emailDomain);
        result.reasons.push('Disposable email domain detected: ' + emailDomain);
      }
    }

    // B. Suspicious TLD Check
    if (config.settings.blockSuspiciousTlds !== false && config.suspiciousTlds) {
      config.suspiciousTlds.forEach(tld => {
        if (emailDomain.endsWith(tld)) {
          result.matchedKeywords.push(tld);
          result.reasons.push('Suspicious email TLD detected: ' + tld);
        }
      });
    }

    // C. Embedded URL Check (Name or Address)
    if (config.settings.blockUrlsInContactFields !== false) {
      const urlRegex = /https?:\/\/|www\./i;
      if (urlRegex.test(name)) {
        result.matchedKeywords.push('url_in_name');
        result.reasons.push('URL found in Name field');
      }
      if (urlRegex.test(address)) {
        result.matchedKeywords.push('url_in_address');
        result.reasons.push('URL found in Address field');
      }
    }

    // D. Name Invalid Characters Check
    if (/[0-9$<>{}]/.test(name) && name.length > 0) {
      result.matchedKeywords.push('invalid_name_chars');
      result.reasons.push('Invalid characters or digits in Name field');
    }
// E. STRICT PHONE NUMBER VALIDATION
    if (phone.length > 0 && config.settings.enableStrictPhoneValidation !== false) {
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const phoneConfig = config.phoneValidation || { minDigits: 7, blockedPatterns: ['555', '123456'] };

      // E1. Alphabetical Characters Check
      if (/[a-zA-Z]/.test(phone)) {
        result.matchedKeywords.push('letters_in_phone');
        result.reasons.push('Alphabetical characters found in Phone field (' + phone + ')');
      }

      // E2. Exact Blocked Placeholder Patterns (Runs before repetition check)
      else if (phoneConfig.blockedPatterns && phoneConfig.blockedPatterns.some(pat => cleanPhoneDigits === pat || phone === pat)) {
        result.matchedKeywords.push('fake_phone_pattern');
        result.reasons.push('Fake/placeholder phone pattern detected (' + phone + ')');
      }

      // E3. Repetitive Digits Check (Requires at least 7 digits to distinguish from short 3-digit traps)
      else if (cleanPhoneDigits.length >= 7 && /^(\d)\1+$/.test(cleanPhoneDigits)) {
        result.matchedKeywords.push('repetitive_phone');
        result.reasons.push('Fake repetitive phone number detected (' + phone + ')');
      }

      // E4. Minimum Digit Length Check
      else if (cleanPhoneDigits.length < (phoneConfig.minDigits || 7)) {
        result.matchedKeywords.push('phone_too_short');
        result.reasons.push('Phone number is too short to be valid (' + phone + ')');
      }
    }
  }

  result.matchedKeywords = [...new Set(result.matchedKeywords)];
  result.isSpam = result.matchedKeywords.length > 0 || result.reasons.length > 0;

  return result;
}

/**
 * Checks if the honeypot field was filled out by a bot.
 */
function checkHoneypot(honeypotValue) {
  if (!honeypotValue) return false;
  return String(honeypotValue).trim().length > 0;
}

/**
 * Loads SPAM_CONFIG from Script Properties or returns fallback.
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