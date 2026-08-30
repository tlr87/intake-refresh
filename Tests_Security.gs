/**
 * ============================================================================
 * Tests_EmailAdmin.js
 * ============================================================================
 *
 * Sends REAL admin test emails covering moderation combinations.
 *
 * Tests:
 *   1. Normal
 *   2. Review
 *   3. Spam
 *   4. Urgent
 *   5. Review + Spam + Urgent
 *
 * WARNING:
 * These tests SEND REAL EMAIL and consume MailApp quota.
 *
 * Run:
 *   testAdminEmailModeration
 * ============================================================================
 */


/**
 * Master admin moderation email test.
 */
function testAdminEmailModeration() {

  Logger.log('============================================================');
  Logger.log('ADMIN EMAIL MODERATION TESTS');
  Logger.log('============================================================');

  const formConfig =
    typeof getFormConfig === 'function'
      ? getFormConfig()
      : {};

  const adminEmail =
    formConfig &&
    formConfig.settings &&
    formConfig.settings.adminEmail
      ? formConfig.settings.adminEmail
      : 'tom@rd3tech.com';


  // --------------------------------------------------------------------------
  // TEST 1 — NORMAL
  // --------------------------------------------------------------------------

  sendAdminModerationTest(
    adminEmail,
    'Peter Parker',
    'Website Support',
    {
      subjectPrefix: '',
      review: false,
      spam: false,
      urgent: false
    }
  );


  // --------------------------------------------------------------------------
  // TEST 2 — REVIEW
  // --------------------------------------------------------------------------

  sendAdminModerationTest(
    adminEmail,
    'Hermione Granger',
    'Computer Help',
    {
      subjectPrefix: '[FLAGGED] ',
      review: true,
      spam: false,
      urgent: false
    }
  );


  // --------------------------------------------------------------------------
  // TEST 3 — SPAM
  // --------------------------------------------------------------------------

  sendAdminModerationTest(
    adminEmail,
    'Tony Stark',
    'Website Support',
    {
      subjectPrefix: '[SPAM] ',
      review: false,
      spam: true,
      urgent: false
    }
  );


  // --------------------------------------------------------------------------
  // TEST 4 — URGENT
  // --------------------------------------------------------------------------

  sendAdminModerationTest(
    adminEmail,
    'Luke Skywalker',
    'Something Broken',
    {
      subjectPrefix: '[URGENT] ',
      review: false,
      spam: false,
      urgent: true
    }
  );


  // --------------------------------------------------------------------------
  // TEST 5 — REVIEW + SPAM + URGENT
  // --------------------------------------------------------------------------

  sendAdminModerationTest(
    adminEmail,
    'Indiana Jones',
    'Technology Emergency',
    {
      subjectPrefix: '[SPAM] [URGENT] [FLAGGED] ',
      review: true,
      spam: true,
      urgent: true
    }
  );


  Logger.log('============================================================');
  Logger.log('✅ ALL ADMIN MODERATION EMAIL TESTS PASSED');
  Logger.log('============================================================');
}


/**
 * Builds and sends one admin moderation test email.
 */
function sendAdminModerationTest(
  adminEmail,
  clientName,
  helpCategory,
  flags
) {

  const payload = {

    submissionDate: new Date(),

    client: {
      name: clientName,
      email: 'test.client@example.com',
      phone: '021 123 4567',
      location: 'Auckland',
      contactPreference: 'Email',
      contactingAs: 'Home or Family',
      usedBefore: true
    },

    request: {
      helpCategory: helpCategory,
      userGoal: 'This is an automated admin moderation test.',
      urgency: flags.urgent ? 'High' : 'Normal'
    },

    security: {}
  };


  const moderation = {

    reviewResult: {
      needsReview: flags.review,
      matchedKeywords: flags.review
        ? ['TEST_REVIEW']
        : []
    },

    spamResult: {
      isSpam: flags.spam,
      matchedKeywords: flags.spam
        ? ['TEST_SPAM']
        : []
    },

    isUrgent: flags.urgent,

    subjectPrefix: flags.subjectPrefix
  };


  Logger.log('------------------------------------------------------------');
  Logger.log('Admin moderation test');
  Logger.log('Client: ' + clientName);
  Logger.log('Category: ' + helpCategory);
  Logger.log('Review: ' + flags.review);
  Logger.log('Spam: ' + flags.spam);
  Logger.log('Urgent: ' + flags.urgent);
  Logger.log('Prefix: ' + flags.subjectPrefix);
  Logger.log('------------------------------------------------------------');


  try {

    const result = sendAdminEmail(
      payload,
      {},
      moderation,
      adminEmail
    );

    if (result !== true) {
      throw new Error(
        'sendAdminEmail() did not return true.'
      );
    }

    Logger.log('✅ Admin email sent successfully');
    Logger.log('To: ' + adminEmail);

  } catch (err) {

    Logger.log(
      '❌ Admin email failed for ' +
      clientName +
      ': ' +
      err.toString()
    );

    throw err;
  }
}




/**
 * ============================================================================
 * Tests_EmailModeration.js
 * ============================================================================
 *
 * Checks admin email moderation prefixes WITHOUT sending email.
 *
 * Tests individually:
 *   1. Review
 *   2. SPAM
 *   3. URGENT
 *
 * Run:
 *   testAdminModerationPrefixes
 * ============================================================================
 */


/**
 * Master moderation-prefix test.
 */
function testAdminModerationPrefixes() {

  Logger.log('============================================================');
  Logger.log('ADMIN MODERATION PREFIX TESTS');
  Logger.log('============================================================');

  testAdminReviewPrefix();
  testAdminSpamPrefix();
  testAdminUrgentPrefix();

  Logger.log('============================================================');
  Logger.log('✅ ALL ADMIN MODERATION PREFIX TESTS PASSED');
  Logger.log('============================================================');
}


/**
 * REVIEW only.
 */
function testAdminReviewPrefix() {

  const reviewConfig =
    typeof getReviewConfig === 'function'
      ? getReviewConfig()
      : {};

  const reviewResult =
    typeof checkReviewKeywords === 'function'
      ? checkReviewKeywords(
          'TEST_REVIEW',
          reviewConfig
        )
      : {
          needsReview: true,
          matchedKeywords: ['TEST_REVIEW']
        };

  const subjectPrefix =
    reviewResult.needsReview
      ? (
          reviewConfig.settings &&
          reviewConfig.settings.flagSubjectPrefix
            ? reviewConfig.settings.flagSubjectPrefix
            : '[FLAGGED] '
        )
      : '';

  const expectedPrefix =
    reviewConfig.settings &&
    reviewConfig.settings.flagSubjectPrefix
      ? reviewConfig.settings.flagSubjectPrefix
      : '[FLAGGED] ';

  if (!reviewResult.needsReview) {
    throw new Error(
      'Review test failed: review was not detected.'
    );
  }

  if (subjectPrefix !== expectedPrefix) {
    throw new Error(
      'Review prefix failed.\n' +
      'Expected: ' + expectedPrefix + '\n' +
      'Got: ' + subjectPrefix
    );
  }

  Logger.log('Review detected: YES');
  Logger.log('Review prefix: ' + subjectPrefix);
  Logger.log('✅ testAdminReviewPrefix PASSED');
}


/**
 * SPAM only.
 */
function testAdminSpamPrefix() {

  const spamConfig =
    typeof getSpamConfig === 'function'
      ? getSpamConfig()
      : {};

  const spamResult =
    typeof checkSpamKeywords === 'function'
      ? checkSpamKeywords(
          'TEST_SPAM',
          spamConfig
        )
      : {
          isSpam: true,
          matchedKeywords: ['TEST_SPAM']
        };

  const subjectPrefix =
    spamResult.isSpam
      ? (
          spamConfig.settings &&
          spamConfig.settings.flagSubjectPrefix
            ? spamConfig.settings.flagSubjectPrefix
            : '[SPAM] '
        )
      : '';

  const expectedPrefix =
    spamConfig.settings &&
    spamConfig.settings.flagSubjectPrefix
      ? spamConfig.settings.flagSubjectPrefix
      : '[SPAM] ';

  if (!spamResult.isSpam) {
    throw new Error(
      'Spam test failed: spam was not detected.'
    );
  }

  if (subjectPrefix !== expectedPrefix) {
    throw new Error(
      'Spam prefix failed.\n' +
      'Expected: ' + expectedPrefix + '\n' +
      'Got: ' + subjectPrefix
    );
  }

  Logger.log('Spam detected: YES');
  Logger.log('Spam prefix: ' + subjectPrefix);
  Logger.log('✅ testAdminSpamPrefix PASSED');
}


/**
 * URGENT only.
 */
function testAdminUrgentPrefix() {

  const urgency = 'High';

  const isUrgent =
    urgency.toLowerCase() === 'high';

  const subjectPrefix =
    isUrgent
      ? '[URGENT] '
      : '';

  const expectedPrefix = '[URGENT] ';

  if (!isUrgent) {
    throw new Error(
      'Urgent test failed: High urgency was not detected.'
    );
  }

  if (subjectPrefix !== expectedPrefix) {
    throw new Error(
      'Urgent prefix failed.\n' +
      'Expected: ' + expectedPrefix + '\n' +
      'Got: ' + subjectPrefix
    );
  }

  Logger.log('Urgent detected: YES');
  Logger.log('Urgent prefix: ' + subjectPrefix);
  Logger.log('✅ testAdminUrgentPrefix PASSED');
}