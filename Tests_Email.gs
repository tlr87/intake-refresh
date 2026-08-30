/**
 * ============================================================================
 * Tests_Email.gs
 * ============================================================================
 *
 * WARNING:
 * These tests SEND REAL EMAIL and consume MailApp daily email quota.
 *
 * Tests:
 *   1. Client confirmation email
 *   2. Admin notification email
 * ============================================================================
 */


/**
 * ============================================================================
 * TEST 1 — CLIENT EMAIL
 * ============================================================================
 *
 * Sends one real client confirmation email.
 */
function testEmail_Client() {

  Logger.log('============================================================');
  Logger.log('EMAIL TEST 1 — CLIENT EMAIL');
  Logger.log('============================================================');

  const testClientEmail = 'test+tom.revill@gmail.com';

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

  const payload = {
    submissionDate: new Date(),

    client: {
      name: 'Peter Parker',
      email: testClientEmail,
      phone: '021 123 4567',
      location: 'Auckland',
      contactPreference: 'Email',
      contactingAs: 'Home or Family',
      usedBefore: true
    },

    request: {
      helpCategory: 'Website Support',
      userGoal: 'Test client email delivery',
      urgency: 'High'
    },

    security: {}
  };

  const displaySchema = {};

  Logger.log('Sending client email to: ' + testClientEmail);

  try {

    const sent = sendClientConfirmation(
      payload,
      displaySchema,
      adminEmail
    );

    if (!sent) {
      throw new Error(
        'sendClientConfirmation() returned false.'
      );
    }

    Logger.log('PASS: Client email sent successfully.');
    Logger.log('Recipient: ' + testClientEmail);

  } catch (err) {

    Logger.log(
      'FAIL: Client email failed: ' +
      err.toString()
    );

    throw err;
  }

  Logger.log('============================================================');
}


/**
 * ============================================================================
 * TEST 2 — ADMIN EMAIL
 * ============================================================================
 *
 * Sends one real admin notification email.
 */
function testEmail_Admin() {

  Logger.log('============================================================');
  Logger.log('EMAIL TEST 2 — ADMIN EMAIL');
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

  const payload = {
    submissionDate: new Date(),

    client: {
      name: 'Peter Parker',
      email: 'test.client@example.com',
      phone: '021 123 4567',
      location: 'Auckland',
      contactPreference: 'Email',
      contactingAs: 'Home or Family',
      usedBefore: true
    },

    request: {
      helpCategory: 'Website Support',
      userGoal: 'Test admin email delivery',
      urgency: 'High'
    },

    security: {}
  };

  const displaySchema = {};

  const moderation = {

    reviewResult: {
      needsReview: false,
      matchedKeywords: []
    },

    spamResult: {
      isSpam: false,
      matchedKeywords: []
    },

    isUrgent: true,

    subjectPrefix: '[URGENT] '
  };

  Logger.log('Sending admin email to: ' + adminEmail);

  try {

    const sent = sendAdminEmail(
      payload,
      displaySchema,
      moderation,
      adminEmail
    );

    if (!sent) {
      throw new Error(
        'sendAdminEmail() returned false.'
      );
    }

    Logger.log('PASS: Admin email sent successfully.');
    Logger.log('Recipient: ' + adminEmail);

  } catch (err) {

    Logger.log(
      'FAIL: Admin email failed: ' +
      err.toString()
    );

    throw err;
  }

  Logger.log('============================================================');
}






function testEmailTemplates() {

Logger.log('============================================================');
Logger.log('EMAIL TEMPLATE RENDERING TEST');
Logger.log('============================================================');

// ------------------------------------------------------------
// 1. Create controlled test submission
// ------------------------------------------------------------
const rawParams = {
'Name': 'Jane Doe',
'Email': '[test.client@example.com](mailto:test.client@example.com)',
'Phone': '021 555 1234',
'Address / Location:': 'Auckland',
'How would you prefer us to contact you?': 'Email',
'Have you used RD3 Tech before?': 'Yes',
'I am contacting RD3 Tech as:': 'Home or Family',
'What can we help you with?': 'Help with Something Broken?',
'What Are You Trying To Achieve?': 'Test email template rendering',
'How Urgent Is This For You?': 'High',
'Website URL Security Check: Please leave this field empty.': ''
};

Logger.log('Raw test submission created: YES');

// ------------------------------------------------------------
// 2. Map submission
// ------------------------------------------------------------
const mapped = mapFormPayload(rawParams);

if (!mapped || !mapped.payload) {
throw new Error(
'Email template test failed: Mapping.gs returned no payload.'
);
}

const payload = mapped.payload;

Logger.log('Mapping successful: YES');

// ------------------------------------------------------------
// 3. Extract mapped data
// ------------------------------------------------------------
const client = payload.client || {};
const request = payload.request || {};
const security = payload.security || {};

// ------------------------------------------------------------
// 4. Honeypot check
// ------------------------------------------------------------
const honeypotValue = security.honeypot || '';

if (honeypotValue && honeypotValue.trim() !== '') {
throw new Error(
'Email template test failed: honeypot was triggered.'
);
}

Logger.log('Honeypot check: PASSED');

// ------------------------------------------------------------
// 5. Load review / spam configuration
// ------------------------------------------------------------
const formConfig =
typeof getFormConfig === 'function'
? getFormConfig()
: {};

const reviewConfig =
typeof getReviewConfig === 'function'
? getReviewConfig()
: {};

const spamConfig =
typeof getSpamConfig === 'function'
? getSpamConfig()
: {};

Logger.log(
'Review configuration loaded: ' +
(typeof getReviewConfig === 'function' ? 'YES' : 'NO')
);

Logger.log(
'Spam configuration loaded: ' +
(typeof getSpamConfig === 'function' ? 'YES' : 'NO')
);

// ------------------------------------------------------------
// 6. Run security / moderation evaluation
// ------------------------------------------------------------
const userGoal = request.userGoal || '';

const reviewResult =
typeof checkReviewKeywords === 'function'
? checkReviewKeywords(userGoal, reviewConfig)
: {
needsReview: false,
matchedKeywords: []
};

const spamResult =
typeof checkSpamKeywords === 'function'
? checkSpamKeywords(userGoal, spamConfig)
: {
isSpam: false,
matchedKeywords: []
};

const isUrgent =
(request.urgency || '').toLowerCase() === 'high';

// ------------------------------------------------------------
// 7. Build EXACT template data used by onFormSubmit()
// ------------------------------------------------------------
const formattedDate = Utilities.formatDate(
new Date(),
Session.getScriptTimeZone() || 'Pacific/Auckland',
'dd MMMM yyyy, h:mm a'
);

const clientData = {
name: client.name || 'Website Visitor',
firstName: client.name
? client.name.split(' ')[0]
: 'there',
email: client.email || 'N/A',
phone: client.phone || 'N/A',
location: client.location || 'N/A',
preferredContact:
client.contactPreference || 'Not provided',
isPreviousCustomer:
!!client.usedBefore,
contactingAs:
client.contactingAs || 'Not provided'
};

const requestData = {
helpCategory:
request.helpCategory || 'Not specified',
userGoal:
request.userGoal || 'Not specified',
urgency:
request.urgency || 'Not specified'
};

const secEvalData = {
isSpam:
spamResult.isSpam || false,


requiresReview:
  reviewResult.needsReview || false,

isUrgent:
  isUrgent,

spamScore:
  spamResult.isSpam ? 100 : 0,

statusText:
  spamResult.isSpam
    ? 'Flagged Spam'
    : (
        reviewResult.needsReview
          ? 'Requires Review'
          : 'Passed Security Check'
      ),

spamFlags:
  spamResult.matchedKeywords || [],

reviewFlags:
  reviewResult.matchedKeywords || [],

flags: [
  ...(spamResult.matchedKeywords || [])
    .map(k => 'SPAM: ' + k),

  ...(reviewResult.matchedKeywords || [])
    .map(k => 'REVIEW: ' + k)
]


};

Logger.log('Template data assembled: YES');

// ------------------------------------------------------------
// 8. Validate data before rendering
// ------------------------------------------------------------
if (clientData.name !== 'Jane Doe') {
throw new Error(
'Email template test failed: client name is incorrect.'
);
}

if (clientData.email !== '[test.client@example.com](mailto:test.client@example.com)') {
throw new Error(
'Email template test failed: client email is incorrect.'
);
}

if (clientData.phone !== '021 555 1234') {
throw new Error(
'Email template test failed: client phone is incorrect.'
);
}

if (clientData.location !== 'Auckland') {
throw new Error(
'Email template test failed: client location is incorrect.'
);
}

if (clientData.preferredContact !== 'Email') {
throw new Error(
'Email template test failed: preferred contact is incorrect.'
);
}

if (clientData.contactingAs !== 'Home or Family') {
throw new Error(
'Email template test failed: contactingAs is incorrect.'
);
}

if (clientData.isPreviousCustomer !== true) {
throw new Error(
'Email template test failed: previous customer flag is incorrect.'
);
}

if (requestData.helpCategory !== 'Help with Something Broken?') {
throw new Error(
'Email template test failed: help category is incorrect.'
);
}

if (requestData.userGoal !== 'Test email template rendering') {
throw new Error(
'Email template test failed: user goal is incorrect.'
);
}

if (requestData.urgency !== 'High') {
throw new Error(
'Email template test failed: urgency is incorrect.'
);
}

Logger.log('Template data validation: PASSED');

// ------------------------------------------------------------
// 9. Render AdminEmail.html
// ------------------------------------------------------------
Logger.log('------------------------------------------------------------');
Logger.log('ADMIN EMAIL TEMPLATE');
Logger.log('------------------------------------------------------------');

let adminHtmlBody = '';

try {


const adminTemplate =
  HtmlService.createTemplateFromFile('AdminEmail');

adminTemplate.submissionDate =
  formattedDate;

adminTemplate.client =
  clientData;

adminTemplate.request =
  requestData;

adminTemplate.secEval =
  secEvalData;

adminHtmlBody =
  adminTemplate.evaluate().getContent();

if (!adminHtmlBody) {
  throw new Error(
    'AdminEmail.html returned empty HTML.'
  );
}

Logger.log('Admin template loaded: YES');
Logger.log('Admin template rendered: YES');


} catch (err) {


throw new Error(
  'Email template test failed: AdminEmail.html could not render. ' +
  err.message
);


}

// ------------------------------------------------------------
// 10. Validate AdminEmail output
// ------------------------------------------------------------
const adminChecks = [
['Jane Doe', 'client name'],
['[test.client@example.com](mailto:test.client@example.com)', 'client email'],
['021 555 1234', 'client phone'],
['Auckland', 'client location'],
['Email', 'preferred contact'],
['Home or Family', 'contacting as'],
['Help with Something Broken?', 'help category'],
['Test email template rendering', 'user goal'],
['High', 'urgency'],
['URGENT REQUEST', 'urgent status']
];

adminChecks.forEach(check => {


if (adminHtmlBody.indexOf(check[0]) === -1) {
  throw new Error(
    'Email template test failed: AdminEmail.html does not contain ' +
    check[1] + ' value "' + check[0] + '".'
  );
}


});

Logger.log('Admin template content validation: PASSED');

// ------------------------------------------------------------
// 11. Render ClientEmail.html
// ------------------------------------------------------------
Logger.log('------------------------------------------------------------');
Logger.log('CLIENT EMAIL TEMPLATE');
Logger.log('------------------------------------------------------------');

let clientHtmlBody = '';

try {

const clientTemplate =
  HtmlService.createTemplateFromFile('ClientEmail');

clientTemplate.submissionDate =
  formattedDate;

clientTemplate.client =
  clientData;

clientTemplate.request =
  requestData;

clientHtmlBody =
  clientTemplate.evaluate().getContent();

if (!clientHtmlBody) {
  throw new Error(
    'ClientEmail.html returned empty HTML.'
  );
}

Logger.log('Client template loaded: YES');
Logger.log('Client template rendered: YES');


} catch (err) {


throw new Error(
  'Email template test failed: ClientEmail.html could not render. ' +
  err.message
);


}

// ------------------------------------------------------------
// 12. Validate ClientEmail output
// ------------------------------------------------------------
const clientChecks = [
['Jane Doe', 'client name'],
['[test.client@example.com](mailto:test.client@example.com)', 'client email'],
['021 555 1234', 'client phone'],
['Auckland', 'client location'],
['Email', 'preferred contact'],
['Help with Something Broken?', 'help category'],
['Test email template rendering', 'user goal']
];

clientChecks.forEach(check => {


if (clientHtmlBody.indexOf(check[0]) === -1) {
  throw new Error(
    'Email template test failed: ClientEmail.html does not contain ' +
    check[1] + ' value "' + check[0] + '".'
  );
}


});

Logger.log('Client template content validation: PASSED');

// ------------------------------------------------------------
// 13. Final report
// ------------------------------------------------------------
Logger.log('============================================================');
Logger.log('EMAIL TEMPLATE VALIDATION');
Logger.log('============================================================');

Logger.log('Mapped payload: YES');
Logger.log('Honeypot passed: YES');
Logger.log('Template data assembled: YES');
Logger.log('AdminEmail.html rendered: YES');
Logger.log('AdminEmail.html content: YES');
Logger.log('ClientEmail.html rendered: YES');
Logger.log('ClientEmail.html content: YES');

Logger.log('============================================================');
Logger.log('✅ EMAIL TEMPLATE TEST PASSED');
Logger.log('============================================================');

Logger.log('AdminEmail.html and ClientEmail.html are ready');
Logger.log('for the controlled email-sending test.');

Logger.log('NO EMAIL WAS SENT.');
Logger.log('NO PRODUCTION DATA WAS MODIFIED.');

Logger.log('============================================================');
}








/**
 * ============================================================================
 * testEmailSending()
 * ============================================================================
 *
 * CONTROLLED EMAIL-SENDING TEST
 *
 * Purpose:
 *   Verifies that the pipeline can actually send:
 *     1. Admin notification email
 *     2. Client confirmation email
 *
 * WARNING:
 *   THIS TEST SENDS REAL EMAIL.
 *
 * It uses the test client address from the mock submission and the configured
 * admin email from getFormConfig().
 *
 * It does NOT submit a real Google Form.
 * It does NOT modify production data.
 * ============================================================================
 */
function testEmailSending() {

  Logger.log('============================================================');
  Logger.log('CONTROLLED EMAIL SENDING TEST');
  Logger.log('============================================================');

  // ------------------------------------------------------------------
  // 1. Create the same controlled test submission used by our other tests
  // ------------------------------------------------------------------
  const mockEvent = generateMockFormEvent();

  if (!mockEvent || !mockEvent.response) {
    throw new Error('Email sending test failed: mock event was not created.');
  }

  Logger.log('Raw test submission created: YES');

  // ------------------------------------------------------------------
  // 2. Extract raw form data
  // ------------------------------------------------------------------
  const rawParams = {};
  const itemResponses = mockEvent.response.getItemResponses();

  itemResponses.forEach(function(itemResponse) {

    const title = itemResponse.getItem().getTitle();
    const raw = itemResponse.getResponse();

    const value = Array.isArray(raw)
      ? raw.join(', ')
      : String(raw || '');

    rawParams[title] = value;
  });

  const respondentEmail = mockEvent.response.getRespondentEmail();

  if (respondentEmail) {
    rawParams['email'] = respondentEmail;
  }

  Logger.log('Raw form data extracted: YES');

  // ------------------------------------------------------------------
  // 3. Map submission
  // ------------------------------------------------------------------
  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error('Email sending test failed: mapping returned no payload.');
  }

  const payload = mapped.payload;

  Logger.log('Mapping successful: YES');

  // ------------------------------------------------------------------
  // 4. Pull mapped sections
  // ------------------------------------------------------------------
  const client = payload.client || {};
  const request = payload.request || {};
  const security = payload.security || {};

  // ------------------------------------------------------------------
  // 5. Honeypot check
  // ------------------------------------------------------------------
  const honeypotValue = security.honeypot || '';

  if (honeypotValue && honeypotValue.trim() !== '') {
    throw new Error(
      'Email sending test failed: honeypot was triggered.'
    );
  }

  Logger.log('Honeypot check: PASSED');

  // ------------------------------------------------------------------
  // 6. Load configuration
  // ------------------------------------------------------------------
  const formConfig =
    typeof getFormConfig === 'function'
      ? getFormConfig()
      : {};

  const reviewConfig =
    typeof getReviewConfig === 'function'
      ? getReviewConfig()
      : {};

  const spamConfig =
    typeof getSpamConfig === 'function'
      ? getSpamConfig()
      : {};

  const adminEmail =
    formConfig.settings &&
    formConfig.settings.adminEmail
      ? formConfig.settings.adminEmail
      : 'tom@rd3tech.com';

  Logger.log('Review configuration loaded: YES');
  Logger.log('Spam configuration loaded: YES');

  // ------------------------------------------------------------------
  // 7. Moderation checks
  // ------------------------------------------------------------------
  const userGoal = request.userGoal || '';

  const reviewResult =
    typeof checkReviewKeywords === 'function'
      ? checkReviewKeywords(userGoal, reviewConfig)
      : {
          needsReview: false,
          matchedKeywords: []
        };

  const spamResult =
    typeof checkSpamKeywords === 'function'
      ? checkSpamKeywords(userGoal, spamConfig)
      : {
          isSpam: false,
          matchedKeywords: []
        };

  const isUrgent =
    (request.urgency || '').toLowerCase() === 'high';

  Logger.log('Review evaluation: YES');
  Logger.log('Spam evaluation: YES');
  Logger.log('Urgency evaluation: YES');

  // ------------------------------------------------------------------
  // 8. Build template data exactly as Pipeline.js does
  // ------------------------------------------------------------------
  const formattedDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Pacific/Auckland',
    'dd MMMM yyyy, h:mm a'
  );

  const clientData = {
    name: client.name || 'Website Visitor',
    firstName: client.name
      ? client.name.split(' ')[0]
      : 'there',
    email: client.email || 'N/A',
    phone: client.phone || 'N/A',
    location: client.location || 'N/A',
    preferredContact:
      client.contactPreference || 'Not provided',
    isPreviousCustomer:
      !!client.usedBefore,
    contactingAs:
      client.contactingAs || 'Not provided'
  };

  const requestData = {
    helpCategory:
      request.helpCategory || 'Not specified',
    userGoal:
      request.userGoal || 'Not specified',
    urgency:
      request.urgency || 'Not specified'
  };

  const secEvalData = {
    isSpam:
      spamResult.isSpam || false,

    requiresReview:
      reviewResult.needsReview || false,

    isUrgent:
      isUrgent,

    spamScore:
      spamResult.isSpam ? 100 : 0,

    statusText:
      spamResult.isSpam
        ? 'Flagged Spam'
        : (
            reviewResult.needsReview
              ? 'Requires Review'
              : 'Passed Security Check'
          ),

    spamFlags:
      spamResult.matchedKeywords || [],

    reviewFlags:
      reviewResult.matchedKeywords || [],

    flags: [
      ...(spamResult.matchedKeywords || [])
        .map(function(k) {
          return 'SPAM: ' + k;
        }),

      ...(reviewResult.matchedKeywords || [])
        .map(function(k) {
          return 'REVIEW: ' + k;
        })
    ]
  };

  // ------------------------------------------------------------------
  // 9. Build subject prefix exactly as Pipeline.js does
  // ------------------------------------------------------------------
  let subjectPrefix = '';

  if (spamResult.isSpam) {
    subjectPrefix +=
      (
        spamConfig.settings &&
        spamConfig.settings.flagSubjectPrefix
      )
        ? spamConfig.settings.flagSubjectPrefix
        : '[SPAM] ';
  }

  if (isUrgent) {
    subjectPrefix += '[URGENT] ';
  }

  if (reviewResult.needsReview) {
    subjectPrefix +=
      (
        reviewConfig.settings &&
        reviewConfig.settings.flagSubjectPrefix
      )
        ? reviewConfig.settings.flagSubjectPrefix
        : '[FLAGGED] ';
  }

  // ------------------------------------------------------------------
  // 10. Build expected subjects
  // ------------------------------------------------------------------
  const expectedAdminSubject =
    `${subjectPrefix}[New Enquiry] ${clientData.name} | ${requestData.helpCategory} — RD3 Tech`;

  let expectedClientSubject = '';

  if (
    typeof EMAIL_SUBJECTS !== 'undefined' &&
    EMAIL_SUBJECTS &&
    typeof EMAIL_SUBJECTS.client === 'function'
  ) {
    expectedClientSubject =
      EMAIL_SUBJECTS.client(
        clientData.name,
        requestData.helpCategory
      );
  } else {
    throw new Error(
      'Email sending test failed: EMAIL_SUBJECTS.client() is unavailable.'
    );
  }

  // ------------------------------------------------------------------
  // 11. Display test information before sending
  // ------------------------------------------------------------------
  Logger.log('------------------------------------------------------------');
  Logger.log('EMAIL SENDING PLAN');
  Logger.log('------------------------------------------------------------');

  Logger.log('Admin recipient: ' + adminEmail);
  Logger.log('Client recipient: ' + clientData.email);

  Logger.log('Admin subject: ' + expectedAdminSubject);
  Logger.log('Client subject: ' + expectedClientSubject);

  Logger.log('Client reply-to: ' + adminEmail);
  Logger.log(
    'Admin reply-to: ' +
    (
      clientData.email !== 'N/A'
        ? clientData.email
        : adminEmail
    )
  );

  // ------------------------------------------------------------------
  // 12. Validate recipients before sending
  // ------------------------------------------------------------------
  if (!adminEmail) {
    throw new Error(
      'Email sending test failed: admin email is empty.'
    );
  }

  if (
    !clientData.email ||
    clientData.email === 'N/A'
  ) {
    throw new Error(
      'Email sending test failed: client test email is empty.'
    );
  }

  Logger.log('Recipient validation: PASSED');

  // ------------------------------------------------------------------
  // 13. Render AdminEmail.html
  // ------------------------------------------------------------------
  const adminTemplate =
    HtmlService.createTemplateFromFile('AdminEmail');

  adminTemplate.submissionDate = formattedDate;
  adminTemplate.client = clientData;
  adminTemplate.request = requestData;
  adminTemplate.secEval = secEvalData;

  const adminHtmlBody =
    adminTemplate.evaluate().getContent();

  if (!adminHtmlBody) {
    throw new Error(
      'Email sending test failed: AdminEmail.html rendered empty.'
    );
  }

  Logger.log('Admin template rendered: YES');

  // ------------------------------------------------------------------
  // 14. Render ClientEmail.html
  // ------------------------------------------------------------------
  const clientTemplate =
    HtmlService.createTemplateFromFile('ClientEmail');

  clientTemplate.submissionDate = formattedDate;
  clientTemplate.client = clientData;
  clientTemplate.request = requestData;

  const clientHtmlBody =
    clientTemplate.evaluate().getContent();

  if (!clientHtmlBody) {
    throw new Error(
      'Email sending test failed: ClientEmail.html rendered empty.'
    );
  }

  Logger.log('Client template rendered: YES');

  // ------------------------------------------------------------------
  // 15. Send ADMIN email
  // ------------------------------------------------------------------
  Logger.log('------------------------------------------------------------');
  Logger.log('SENDING ADMIN TEST EMAIL');
  Logger.log('------------------------------------------------------------');

  try {

    MailApp.sendEmail({
      to: adminEmail,
      replyTo:
        clientData.email !== 'N/A'
          ? clientData.email
          : adminEmail,
      subject: expectedAdminSubject,
      htmlBody: adminHtmlBody
    });

    Logger.log('Admin email sent: YES');

  } catch (err) {

    Logger.log(
      'Admin email sent: NO'
    );

    throw new Error(
      'Email sending test failed: Admin email could not be sent. ' +
      err.message
    );
  }

  // ------------------------------------------------------------------
  // 16. Send CLIENT email
  // ------------------------------------------------------------------
  Logger.log('------------------------------------------------------------');
  Logger.log('SENDING CLIENT TEST EMAIL');
  Logger.log('------------------------------------------------------------');

  try {

    MailApp.sendEmail({
      to: clientData.email,
      replyTo: adminEmail,
      subject: expectedClientSubject,
      htmlBody: clientHtmlBody
    });

    Logger.log('Client email sent: YES');

  } catch (err) {

    Logger.log(
      'Client email sent: NO'
    );

    throw new Error(
      'Email sending test failed: Client email could not be sent. ' +
      err.message
    );
  }

  // ------------------------------------------------------------------
  // 17. Final result
  // ------------------------------------------------------------------
  Logger.log('============================================================');
  Logger.log('EMAIL SENDING VALIDATION');
  Logger.log('============================================================');

  Logger.log('Mapped payload: YES');
  Logger.log('Honeypot passed: YES');
  Logger.log('Moderation evaluation: YES');
  Logger.log('Template data assembled: YES');
  Logger.log('AdminEmail.html rendered: YES');
  Logger.log('ClientEmail.html rendered: YES');
  Logger.log('Admin email sent: YES');
  Logger.log('Client email sent: YES');

  Logger.log('============================================================');
  Logger.log('✅ CONTROLLED EMAIL SENDING TEST PASSED');
  Logger.log('============================================================');

  Logger.log(
    'Check the admin inbox for the test notification.'
  );

  Logger.log(
    'Check the client test inbox for the confirmation email.'
  );

  Logger.log(
    'This test used controlled test data only.'
  );

  Logger.log('============================================================');
}
