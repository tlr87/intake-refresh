/**
 * ============================================================================
 * RD3 TECH — TEST SUITE
 * ============================================================================
 *
 * Purpose:
 * - Verify configuration loading
 * - Verify keyword/security detection
 * - Verify form field mapping
 * - Verify submission handlers
 * - Verify email template rendering
 *
 * IMPORTANT:
 * Tests that send real emails are explicitly named `send...`.
 * Tests that submit real Google Form responses are explicitly named
 * `submit...`.
 * ============================================================================
 */


/**
 * ============================================================================
 * TEST RUNNERS
 * ============================================================================
 */

/**
 * Run all safe tests.
 *
 * Does NOT:
 * - send email
 * - submit a real Google Form response
 */
function runAllTests() {
  Logger.log('============================================================');
  Logger.log('RD3 TECH — TEST SUITE');
  Logger.log('============================================================');

  testKeywordChecker();
  testSpamFilter();
  testPhoneSpamRules();
  testConfigLoading();
  testReviewConfigOverride();
  testEmailTemplateRendering();

  Logger.log('============================================================');
  Logger.log('SAFE TESTS COMPLETE');
  Logger.log('============================================================');
}


/**
 * Run tests that interact with Google services.
 *
 * WARNING:
 * This may submit a real Form response.
 */
function runIntegrationTests() {
  Logger.log('============================================================');
  Logger.log('RD3 TECH — INTEGRATION TEST SUITE');
  Logger.log('============================================================');

  testConfigLoading();
  testFormFieldMapping();
  testDoPost();

  Logger.log('============================================================');
  Logger.log('INTEGRATION TESTS COMPLETE');
  Logger.log('============================================================');
}


/**
 * ============================================================================
 * TEST 1 — REVIEW / KEYWORD CHECKER
 * ============================================================================
 */

function testKeywordChecker() {
  Logger.log('\n--- REVIEW KEYWORD TESTS ---');

  const testCases = [
    {
      name: 'Out-of-scope TV',
      text: 'My TV screen has a display fault.',
      expected: true
    },
    {
      name: 'Spam / SEO',
      text: 'Guest post services and backlinks for crypto projects.',
      expected: true
    },
    {
      name: 'Valid IT enquiry',
      text: 'Need help setting up Microsoft 365 and Wi-Fi.',
      expected: false
    },
    {
      name: 'Word boundary safeguard',
      text: 'Trying to improve productivity and activity.',
      expected: false
    }
  ];

  testCases.forEach(test => {
    const result = checkReviewKeywords(test.text);

    assertEqual(
      test.expected,
      result.needsReview,
      test.name
    );

    Logger.log(
      '  Matched: [' +
      result.matchedKeywords.join(', ') +
      ']'
    );
  });
}


/**
 * ============================================================================
 * TEST 2 — REVIEW CONFIGURATION
 * ============================================================================
 */

function testReviewConfigOverride() {
  Logger.log('\n--- REVIEW CONFIGURATION TESTS ---');

  const config = {
    settings: {
      enableReview: true
    },
    categories: {
      outOfScope: [
        'customkeyword',
        'testphrase'
      ]
    }
  };

  const result = checkReviewKeywords(
    'This contains a customkeyword.',
    config
  );

  assertTrue(
    result.needsReview,
    'Custom review keyword detected'
  );

  assertTrue(
    result.matchedKeywords.includes('customkeyword'),
    'Correct review keyword returned'
  );
}


/**
 * ============================================================================
 * TEST 3 — SPAM FILTER
 * ============================================================================
 */

function testSpamFilter() {
  Logger.log('\n--- SPAM FILTER TESTS ---');

  const cleanSubmission = {
    honeypot: '',
    name: 'Thomas Miller',
    email: 'tom@rd3tech.com',
    phone: '021 555 9999',
    address: '123 Queen Street, Auckland'
  };

  const spamSubmission = {
    honeypot: '',
    name: 'John Casino http://spam-site.com',
    email: 'spammer@mailinator.com',
    phone: '021 ABC 9999',
    address: 'Visit claim-prize.xyz'
  };

  const cleanResult = checkSpamKeywords(cleanSubmission);
  const spamResult = checkSpamKeywords(spamSubmission);

  assertFalse(
    cleanResult.isSpam,
    'Clean submission is not flagged'
  );

  assertTrue(
    spamResult.isSpam,
    'Spam submission is flagged'
  );

  assertTrue(
    spamResult.reasons.length > 0,
    'Spam reasons are returned'
  );

  Logger.log(
    '  Spam reasons: ' +
    spamResult.reasons.join(', ')
  );
}


/**
 * ============================================================================
 * TEST 4 — PHONE SPAM RULES
 * ============================================================================
 */

function testPhoneSpamRules() {
  Logger.log('\n--- PHONE SPAM TESTS ---');

  const testCases = [
    {
      phone: '021 ABC 9999',
      expectedSpam: true,
      expectedReason: 'letters_in_phone'
    },
    {
      phone: '0000000000',
      expectedSpam: true,
      expectedReason: 'repetitive_phone'
    },
    {
      phone: '555',
      expectedSpam: true,
      expectedReason: 'fake_phone_pattern'
    },
    {
      phone: '12345678',
      expectedSpam: true,
      expectedReason: 'fake_phone_pattern'
    },
    {
      phone: '021 555 9999',
      expectedSpam: false
    }
  ];

  testCases.forEach(test => {
    const payload = {
      honeypot: '',
      name: 'Test User',
      email: 'test@rd3tech.com',
      phone: test.phone,
      address: 'Auckland'
    };

    const result = checkSpamKeywords(payload);

    assertEqual(
      test.expectedSpam,
      result.isSpam,
      'Phone: ' + test.phone
    );

    if (test.expectedReason) {
      assertTrue(
        result.matchedKeywords.includes(test.expectedReason),
        'Reason detected: ' + test.expectedReason
      );
    }
  });
}


/**
 * ============================================================================
 * TEST 5 — CONFIGURATION LOADING
 * ============================================================================
 */

function testConfigLoading() {
  Logger.log('\n--- CONFIGURATION TESTS ---');

  const formConfig = getFormConfig();
  const reviewConfig = getReviewConfig();
  const spamConfig = getSpamConfig();
  const urgencyConfig = getUrgencyConfig();

  assertTrue(
    !!formConfig,
    'Form configuration loaded'
  );

  assertTrue(
    !!reviewConfig,
    'Review configuration loaded'
  );

  assertTrue(
    !!spamConfig,
    'Spam configuration loaded'
  );

  assertTrue(
    !!urgencyConfig,
    'Urgency configuration loaded'
  );

  assertTrue(
    !!formConfig.fields,
    'Form fields configuration exists'
  );

  assertTrue(
    !!formConfig.settings,
    'Form settings configuration exists'
  );
}


/**
 * ============================================================================
 * TEST 6 — FORM FIELD MAPPING
 * ============================================================================
 *
 * Verifies that the configured field mappings can be resolved without
 * submitting a real response.
 * ============================================================================
 */

function testFormFieldMapping() {
  Logger.log('\n--- FORM FIELD MAPPING TEST ---');

  const config = getFormConfig();
  const fields = config.fields || {};

  const requiredFields = [
    'name',
    'email',
    'phone',
    'contactPreference',
    'usedBefore',
    'clientType',
    'helpCategory',
    'userGoal',
    'urgency'
  ];

  requiredFields.forEach(key => {
    assertTrue(
      !!fields[key],
      'Field configuration exists: ' + key
    );

    assertTrue(
      !!fields[key].titleMatch,
      'Field titleMatch exists: ' + key
    );
  });
}


/**
 * ============================================================================
 * TEST 7 — EMAIL TEMPLATE RENDERING
 * ============================================================================
 *
 * Safe:
 * - Does not send email
 * - Only renders AdminEmail.html
 * ============================================================================
 */

function testEmailTemplateRendering() {
  Logger.log('\n--- EMAIL TEMPLATE TEST ---');

  const template = HtmlService.createTemplateFromFile('AdminEmail');

  template.submissionDate = new Date().toLocaleString();

  template.client = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '021 555 9999',
    location: 'Whangarei, Northland',
    preferredContact: 'Email',
    contactingAs: 'Small Business',
    isPreviousCustomer: false
  };

  template.request = {
    situation: 'Help with Something Broken?',
    goal: 'Need help diagnosing a network issue.',
    timeframe: 'Medium'
  };

  template.secEval = {
    isSpam: false,
    spamFlags: [],
    requiresReview: false,
    reviewFlags: []
  };

  const html = template.evaluate().getContent();

  assertTrue(
    html.length > 0,
    'Admin email template rendered'
  );

  assertTrue(
    html.includes('Test User'),
    'Client name rendered'
  );
}


/**
 * ============================================================================
 * TEST 8 — doPost
 * ============================================================================
 *
 * WARNING:
 * Calls the real doPost() handler.
 *
 * This should NOT be included in runAllTests().
 */
function testDoPost() {
  Logger.log('\n--- DOPOST TEST ---');

  const mockEvent = {
    parameter: {
      rd3_name: 'Automation Tester',
      rd3_email: 'tom@rd3tech.com',
      rd3_phone: '021 999 8888',
      rd3_contactPreference: 'Email',
      rd3_usedBefore: 'Yes',
      rd3_clientType: 'Business',
      rd3_helpCategory: 'General Inquiry',
      rd3_urgency: 'Medium',
      rd3_userGoal: 'Direct doPost integration test.'
    }
  };

  try {
    const response = doPost(mockEvent);

    assertTrue(
      !!response,
      'doPost returned a response'
    );

    Logger.log(
      '  Response: ' +
      response.getContent()
    );

  } catch (error) {
    fail(
      'doPost threw an exception: ' +
      error.message
    );
  }
}


/**
 * ============================================================================
 * TEST 9 — HONEYPOT
 * ============================================================================
 */

function testHoneypot() {
  Logger.log('\n--- HONEYPOT TEST ---');

  const config = getFormConfig();

  const honeypotTitle =
    config.fields.honeypot
      ? config.fields.honeypot.titleMatch
      : 'leave blank';

  const responses = [
    createMockItemResponse(
      config.fields.name.titleMatch,
      'Spam Bot'
    ),
    createMockItemResponse(
      config.fields.email.titleMatch,
      'spambot@example.com'
    ),
    createMockItemResponse(
      config.fields.userGoal.titleMatch,
      'Spam submission'
    ),
    createMockItemResponse(
      honeypotTitle,
      'BOT FILLED THIS'
    )
  ];

  const event = {
    response: {
      getRespondentEmail: function() {
        return 'spambot@example.com';
      },

      getItemResponses: function() {
        return responses;
      }
    }
  };

  try {
    onFormSubmit(event);

    Logger.log(
      '  Honeypot handler completed.'
    );

  } catch (error) {
    fail(
      'Honeypot test threw an exception: ' +
      error.message
    );
  }
}


/**
 * ============================================================================
 * OPTIONAL — REAL EMAIL TESTS
 * ============================================================================
 *
 * These are deliberately separated from the normal test suite.
 */


/**
 * Send a simple test email.
 */
function sendTestEmail() {
  const recipient = 'tom@rd3tech.com';

  GmailApp.sendEmail(
    recipient,
    'RD3 Tech — Test Email',
    'This is a test email from the RD3 Tech Apps Script test suite.'
  );

  Logger.log(
    'Test email sent to ' + recipient
  );
}


/**
 * Send a realistic AdminEmail.html test.
 */
function sendAdminEmailTest() {
  const recipient = 'tom@rd3tech.com';

  const template =
    HtmlService.createTemplateFromFile('AdminEmail');

  template.submissionDate =
    new Date().toLocaleString();

  template.client = {
    name: 'Sarah Connor',
    email: 'tom@rd3tech.com',
    phone: '027 987 6543',
    location: 'Whangarei, Northland',
    preferredContact: 'Email',
    contactingAs: 'Small Business',
    isPreviousCustomer: true
  };

  template.request = {
    situation: 'Help with Something Broken?',
    goal:
      'Our main network router keeps disconnecting during peak operating hours.',
    timeframe: 'High'
  };

  template.secEval = {
    isSpam: false,
    spamFlags: [],
    requiresReview: false,
    reviewFlags: []
  };

  const htmlBody =
    template.evaluate().getContent();

  GmailApp.sendEmail({
    to: recipient,
    subject: 'RD3 Tech — TEST Admin Notification',
    htmlBody: htmlBody
  });

  Logger.log(
    'Admin test email sent to ' + recipient
  );
}


/**
 * ============================================================================
 * TEST HELPERS
 * ============================================================================
 */


/**
 * Assert two values are equal.
 */
function assertEqual(expected, actual, description) {
  if (expected === actual) {
    Logger.log('PASS: ' + description);
    return;
  }

  fail(
    description +
    ' | Expected: ' +
    expected +
    ' | Actual: ' +
    actual
  );
}


/**
 * Assert value is true.
 */
function assertTrue(value, description) {
  if (value === true) {
    Logger.log('PASS: ' + description);
    return;
  }

  fail(description);
}


/**
 * Assert value is false.
 */
function assertFalse(value, description) {
  if (value === false) {
    Logger.log('PASS: ' + description);
    return;
  }

  fail(description);
}


/**
 * Record a failed test.
 */
function fail(description) {
  Logger.log('FAIL: ' + description);
}


/**
 * Create a mock Google Form ItemResponse.
 */
function createMockItemResponse(title, responseValue) {
  return {
    getItem: function() {
      return {
        getTitle: function() {
          return title;
        }
      };
    },

    getResponse: function() {
      return responseValue;
    }
  };
}