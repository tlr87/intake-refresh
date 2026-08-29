/**
 * Configuration Constants
 */
const CONFIG = {
  DEFAULT_ADMIN_EMAIL: 'tom@rd3tech.com',
  GOOGLE_FORM_ID: '1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g',
  DEFAULT_COOLDOWN_SEC: 60
};

/**
 * ============================================================================
 * RD3 TECH — WEBSITE FORM WEB APP ENDPOINT
 * ============================================================================
 *
 * WordPress Contact Form
 *        ↓
 *     doPost()
 *        ↓
 *    Mapping.gs
 *        ↓
 *  Moderation
 *        ↓
 *  Admin Email
 *  Client Email
 *  Google Sheet
 *
 * IMPORTANT:
 * This does NOT submit the website enquiry back into Google Forms.
 * The real Google Form has its own onFormSubmit(e) pipeline.
 */
function doPost(e) {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — WEBSITE doPost()');
  Logger.log('============================================================');

  try {

    // ------------------------------------------------------------------------
    // 1. LOAD CONFIGURATION
    // ------------------------------------------------------------------------

    const configs = {
      form: typeof getFormConfig === 'function'
        ? getFormConfig()
        : {},

      review: typeof getReviewConfig === 'function'
        ? getReviewConfig()
        : {},

      spam: typeof getSpamConfig === 'function'
        ? getSpamConfig()
        : {},

      rateLimit: typeof getRateLimitConfig === 'function'
        ? getRateLimitConfig()
        : {
            enabled: true,
            cooldownSeconds: CONFIG.DEFAULT_COOLDOWN_SEC || 60
          }
    };

    const adminEmail =
      configs.form &&
      configs.form.settings &&
      configs.form.settings.adminEmail
        ? configs.form.settings.adminEmail
        : CONFIG.DEFAULT_ADMIN_EMAIL;

    Logger.log('Admin Email: ' + adminEmail);


    // ------------------------------------------------------------------------
    // 2. READ WEBSITE POST
    // ------------------------------------------------------------------------

    const rawParams = parseIncomingParameters(e);

    Logger.log('RAW WEBSITE PARAMETERS:');
    Logger.log(JSON.stringify(rawParams));


    // ------------------------------------------------------------------------
    // 3. MAP USING Mapping.gs
    // ------------------------------------------------------------------------
    //
    // Mapping.gs is now the single source of truth.
    //

    const mapped = mapFormPayload(rawParams);

    const payload = mapped.payload;
    const displaySchema = mapped.displaySchema;

    Logger.log('MAPPED WEBSITE PAYLOAD:');
    Logger.log(JSON.stringify(payload, null, 2));


    // ------------------------------------------------------------------------
    // 4. BASIC PAYLOAD REFERENCES
    // ------------------------------------------------------------------------

    const client = payload.client || {};
    const request = payload.request || {};
    const security = payload.security || {};

    const userEmail = String(client.email || '')
      .trim()
      .toLowerCase();


    // ------------------------------------------------------------------------
    // 5. HONEYPOT
    // ------------------------------------------------------------------------

    const honeypotValue = String(security.honeypot || '').trim();

    if (honeypotValue !== '') {

      Logger.log(
        '🚫 HONEYPOT TRIPPED: "' +
        honeypotValue +
        '"'
      );

      // Do not reveal that the bot was detected.
      return createJsonResponse({
        status: 'success',
        message: 'Form submitted successfully.'
      });
    }


    // ------------------------------------------------------------------------
    // 6. RATE LIMIT
    // ------------------------------------------------------------------------

    if (
      configs.rateLimit &&
      configs.rateLimit.enabled &&
      userEmail &&
      userEmail !== 'not provided'
    ) {

      if (isRateLimited(userEmail, configs.rateLimit)) {

        const cooldown =
          configs.rateLimit.cooldownSeconds ||
          CONFIG.DEFAULT_COOLDOWN_SEC ||
          60;

        Logger.log(
          '⏱️ RATE LIMIT TRIGGERED: ' +
          userEmail
        );

        return createJsonResponse({
          status: 'error',
          message:
            'Please wait ' +
            cooldown +
            ' seconds before submitting another request.'
        });
      }
    }


    // ------------------------------------------------------------------------
    // 7. MODERATION
    // ------------------------------------------------------------------------
    //
    // IMPORTANT:
    // The current schema uses:
    //
    // request.helpCategory
    // request.userGoal
    // request.urgency
    //

    const userGoal = String(request.userGoal || '').trim();

    const reviewResult =
      typeof checkReviewKeywords === 'function'
        ? checkReviewKeywords(
            userGoal,
            configs.review
          )
        : {
            needsReview: false,
            matchedKeywords: []
          };

    const spamResult =
      typeof checkSpamKeywords === 'function'
        ? checkSpamKeywords(
            userGoal,
            configs.spam
          )
        : {
            isSpam: false,
            matchedKeywords: []
          };

    const isUrgent =
      String(request.urgency || '')
        .trim()
        .toLowerCase() === 'high';


    // ------------------------------------------------------------------------
    // 8. SUBJECT PREFIX
    // ------------------------------------------------------------------------

    let subjectPrefix = '';

    if (spamResult.isSpam) {

      subjectPrefix +=
        (
          configs.spam &&
          configs.spam.settings &&
          configs.spam.settings.flagSubjectPrefix
        )
          ? configs.spam.settings.flagSubjectPrefix
          : '[SPAM] ';
    }

    if (isUrgent) {
      subjectPrefix += '[URGENT] ';
    }

    if (reviewResult.needsReview) {

      subjectPrefix +=
        (
          configs.review &&
          configs.review.settings &&
          configs.review.settings.flagSubjectPrefix
        )
          ? configs.review.settings.flagSubjectPrefix
          : '[FLAGGED] ';
    }


    // ------------------------------------------------------------------------
    // 9. SECURITY EVALUATION OBJECT
    // ------------------------------------------------------------------------

    const moderation = {
      reviewResult: reviewResult,
      spamResult: spamResult,
      isUrgent: isUrgent,
      subjectPrefix: subjectPrefix
    };


    Logger.log('MODERATION:');
    Logger.log(JSON.stringify(moderation, null, 2));


    // ------------------------------------------------------------------------
    // 10. ADMIN EMAIL
    // ------------------------------------------------------------------------

    let adminSent = false;

    try {

      adminSent = sendAdminEmail(
        payload,
        displaySchema,
        moderation,
        adminEmail
      );

      if (adminSent) {
        Logger.log('✅ ADMIN EMAIL SENT');
      } else {
        Logger.log('❌ ADMIN EMAIL FAILED');
      }

    } catch (err) {

      Logger.log(
        '❌ ADMIN EMAIL EXCEPTION: ' +
        err.toString()
      );

      adminSent = false;
    }


    // ------------------------------------------------------------------------
    // 11. CLIENT CONFIRMATION EMAIL
    // ------------------------------------------------------------------------

    let clientSent = false;

    if (
      userEmail &&
      userEmail !== 'not provided' &&
      userEmail.indexOf('@') !== -1
    ) {

      try {

        clientSent = sendClientConfirmation(
          payload,
          displaySchema,
          adminEmail
        );

        if (clientSent) {
          Logger.log('✅ CLIENT EMAIL SENT');
        } else {
          Logger.log('❌ CLIENT EMAIL FAILED');
        }

      } catch (err) {

        Logger.log(
          '❌ CLIENT EMAIL EXCEPTION: ' +
          err.toString()
        );

        clientSent = false;
      }

    } else {

      Logger.log(
        '⚠️ CLIENT EMAIL SKIPPED — no valid email address'
      );
    }


    // ------------------------------------------------------------------------
    // 12. SAVE TO SHEET
    // ------------------------------------------------------------------------

    let sheetSaved = false;

    try {

      sheetSaved = saveToSheet(payload);

      if (sheetSaved) {
        Logger.log('✅ SUBMISSION SAVED TO SHEET');
      } else {
        Logger.log('❌ SUBMISSION SHEET SAVE FAILED');
      }

    } catch (err) {

      Logger.log(
        '❌ SHEET SAVE EXCEPTION: ' +
        err.toString()
      );

      sheetSaved = false;
    }


    // ------------------------------------------------------------------------
    // 13. FINAL RESULT
    // ------------------------------------------------------------------------

    Logger.log('============================================================');
    Logger.log('RD3 TECH — WEBSITE SUBMISSION COMPLETE');
    Logger.log('============================================================');

    Logger.log('Admin Email: ' + (adminSent ? 'SUCCESS' : 'FAILED'));
    Logger.log('Client Email: ' + (clientSent ? 'SUCCESS' : 'FAILED'));
    Logger.log('Sheet: ' + (sheetSaved ? 'SUCCESS' : 'FAILED'));
    Logger.log('============================================================');


    // ------------------------------------------------------------------------
    // 14. RETURN RESPONSE
    // ------------------------------------------------------------------------

    return createJsonResponse({
      status: 'success',
      message: 'Enquiry received successfully.',
      diagnostics: {
        adminEmail: adminSent,
        clientEmail: clientSent,
        sheet: sheetSaved
      }
    });


  } catch (error) {

    Logger.log('============================================================');
    Logger.log('❌ FATAL ERROR IN doPost()');
    Logger.log('============================================================');
    Logger.log(error.toString());
    Logger.log(error.stack || '');
    Logger.log('============================================================');

    return createJsonResponse({
      status: 'error',
      message: 'Unable to process the enquiry.'
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parses incoming POST event payload from JSON or standard Form inputs.
 */
function parseIncomingParameters(e) {
  const rawParams = {};
  if (!e) return rawParams;

  // 1. Check JSON body
  if (e.postData && e.postData.contents) {
    try {
      const jsonBody = JSON.parse(e.postData.contents);
      if (typeof jsonBody === 'object' && jsonBody !== null) {
        Object.keys(jsonBody).forEach(key => {
          rawParams[key] = jsonBody[key];
        });
        return rawParams;
      }
    } catch (err) {
      // Ignore JSON parse errors and fallback to parameters
    }
  }

  // 2. Check query/form parameters
  if (e.parameter) {
    Object.keys(e.parameter).forEach(key => {
      rawParams[key] = e.parameter[key];
    });
  }

  if (e.parameters) {
    Object.keys(e.parameters).forEach(key => {
      if (Array.isArray(e.parameters[key]) && e.parameters[key].length > 1) {
        rawParams[key] = e.parameters[key].join(', ');
      }
    });
  }

  return rawParams;
}

/**
 * Constructs data structures and dispatches the Admin Notification email.
 */
function sendAdminEmail(payload, displaySchema, moderation, adminEmail) {
  const client = payload.client || {};
  const request = payload.request || {};
  const spamResult = moderation.spamResult || {};
  const reviewResult = moderation.reviewResult || {};

  const formattedDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Pacific/Auckland',
    'dd MMMM yyyy, h:mm a'
  );

  const clientData = {
    name: client.name || 'Website Visitor',
    firstName: client.name ? client.name.split(' ')[0] : 'there',
    email: client.email || 'N/A',
    phone: client.phone || 'N/A',
    location: client.location || 'N/A',
    preferredContact: client.contactPreference || 'Not provided',
    isPreviousCustomer: !!client.usedBefore,
    contactingAs: client.contactingAs || 'Not provided'
  };

  const requestData = {
    helpCategory: request.helpCategory || 'Not specified',
    userGoal: request.userGoal || 'Not specified',
    urgency: request.urgency || 'Not specified'
  };

  const secEvalData = {
    isSpam: !!spamResult.isSpam,
    requiresReview: !!reviewResult.needsReview,
    isUrgent: !!moderation.isUrgent,
    spamScore: spamResult.isSpam ? 100 : 0,
    statusText: spamResult.isSpam
      ? 'Flagged Spam'
      : (reviewResult.needsReview ? 'Requires Review' : 'Passed Security Check'),
    spamFlags: spamResult.matchedKeywords || [],
    reviewFlags: reviewResult.matchedKeywords || [],
    flags: [
      ...(spamResult.matchedKeywords || []).map(k => 'SPAM: ' + k),
      ...(reviewResult.matchedKeywords || []).map(k => 'REVIEW: ' + k)
    ]
  };

  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.submissionDate = formattedDate;
  adminTemplate.client = clientData;
  adminTemplate.request = requestData;
  adminTemplate.secEval = secEvalData;

  const adminHtmlBody = adminTemplate.evaluate().getContent();

MailApp.sendEmail({
  to: adminEmail,
  replyTo: clientData.email !== 'N/A' ? clientData.email : adminEmail,
  subject: EMAIL_SUBJECTS.admin(
    moderation.subjectPrefix,
    clientData.name,
    requestData.helpCategory
  ),
  htmlBody: adminHtmlBody
});

  return true;
}

/**
 * Sends a confirmation email back to the submitter.
 */
function sendClientConfirmation(payload, displaySchema, adminEmail) {
  const client = payload.client || {};
  const request = payload.request || {};

  const formattedDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Pacific/Auckland',
    'dd MMMM yyyy, h:mm a'
  );

  const clientData = {
    name: client.name || 'Website Visitor',
    firstName: client.name ? client.name.split(' ')[0] : 'there',
    email: client.email || 'N/A',
    phone: client.phone || 'N/A',
    location: client.location || 'N/A',
    preferredContact: client.contactPreference || 'Not provided',
    isPreviousCustomer: !!client.usedBefore,
    contactingAs: client.contactingAs || 'Not provided'
  };

  const requestData = {
    helpCategory: request.helpCategory || 'Not specified',
    userGoal: request.userGoal || 'Not specified',
    urgency: request.urgency || 'Not specified'
  };

  const clientTemplate = HtmlService.createTemplateFromFile('ClientEmail');
  clientTemplate.submissionDate = formattedDate;
  clientTemplate.client = clientData;
  clientTemplate.request = requestData;

  const clientHtmlBody = clientTemplate.evaluate().getContent();

  MailApp.sendEmail({
    to: clientData.email,
    replyTo: adminEmail,
    subject: EMAIL_SUBJECTS.client(
      clientData.name,
      requestData.helpCategory
    ),
    htmlBody: clientHtmlBody
  });

  return true;
}

/**
 * Appends the mapped website submission into the Google Sheet.
 */
function saveToSheet(payload) {
  const SPREADSHEET_ID = '1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g';

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) return false;
    
    // Look for 'Website Submissions' tab, fallback to the first tab if missing
    let sheet = ss.getSheetByName('Website Submissions');
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    const client = payload.client || {};
    const request = payload.request || {};

    sheet.appendRow([
      payload.submissionDate || new Date(),
      client.name || '',
      client.email || '',
      client.phone || '',
      client.location || '',
      client.contactPreference || '',
      client.contactingAs || '',
      client.usedBefore ? 'Yes' : 'No',
      request.helpCategory || '',
      request.userGoal || '',
      request.urgency || ''
    ]);

    return true;
  } catch (err) {
    Logger.log('saveToSheet error: ' + err.toString());
    return false;
  }
}

/**
 * Checks script cache to enforce a user submission cooldown.
 */
function isRateLimited(email, rateLimitConfig) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = 'rl_' + Utilities.base64Encode(email);
    const cached = cache.get(cacheKey);

    if (cached) {
      return true;
    }

    const cooldownSec = rateLimitConfig.cooldownSeconds || 60;
    cache.put(cacheKey, '1', cooldownSec);
    return false;
  } catch (err) {
    Logger.log('Rate limit check error: ' + err.toString());
    return false;
  }
}

/**
 * Helper to build standard JSON response objects for Web Apps.
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}





