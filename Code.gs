/**
 * Main form submission handler.
 * Uses Mapping.gs as the single source of truth for field extraction.
 */
function onFormSubmit(e) {
  // Defensive check for manual runs
  if (!e || !e.response) {
    Logger.log('⚠️ Manual test run – injecting mock event');
    e = generateMockFormEvent();
  }

  const formConfig   = typeof getFormConfig === 'function' ? getFormConfig() : {};
  const reviewConfig = typeof getReviewConfig === 'function' ? getReviewConfig() : {};
  const spamConfig   = typeof getSpamConfig === 'function' ? getSpamConfig() : {};

  const adminEmail = (formConfig.settings && formConfig.settings.adminEmail)
    ? formConfig.settings.adminEmail
    : 'tom@rd3tech.com';

  // ------------------------------------------------------------------
  // 1. Turn Form itemResponses into a simple key/value object
  // ------------------------------------------------------------------
  const rawParams = {};
  const itemResponses = e.response.getItemResponses();

  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    const raw = itemResponse.getResponse();
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw || '');
    rawParams[title] = value;          // title is the key – Mapping.gs aliases will match it
  });

  // Also keep the respondent email if the form collects it
  const respondentEmail = e.response.getRespondentEmail();
  if (respondentEmail) {
    rawParams['email'] = respondentEmail;
  }

  // ------------------------------------------------------------------
  // 2. Map everything with Mapping.gs
  // ------------------------------------------------------------------
  const mapped = mapFormPayload(rawParams);
  const payload = mapped.payload;

  const client = payload.client || {};
  const request = payload.request || {};
  const security = payload.security || {};

  // ------------------------------------------------------------------
  // 3. Honeypot check
  // ------------------------------------------------------------------
  const honeypotValue = security.honeypot || '';
  if (honeypotValue && honeypotValue.trim() !== '') {
    Logger.log('🚫 HONEYPOT TRIPPED: "' + honeypotValue + '"');
    return;
  }

  // ------------------------------------------------------------------
  // 4. Moderation
  // ------------------------------------------------------------------
  const userGoal = request.userGoal || '';

  const reviewResult = typeof checkReviewKeywords === 'function'
    ? checkReviewKeywords(userGoal, reviewConfig)
    : { needsReview: false, matchedKeywords: [] };

  const spamResult = typeof checkSpamKeywords === 'function'
    ? checkSpamKeywords(userGoal, spamConfig)
    : { isSpam: false, matchedKeywords: [] };

  const isUrgent = (request.urgency || '').toLowerCase() === 'high';

  // ------------------------------------------------------------------
  // 5. Build the objects the email templates expect
  // ------------------------------------------------------------------
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
    isSpam: spamResult.isSpam || false,
    requiresReview: reviewResult.needsReview || false,
    isUrgent: isUrgent,
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

  // ------------------------------------------------------------------
  // 6. Subject prefix
  // ------------------------------------------------------------------
  let subjectPrefix = '';
  if (spamResult.isSpam) subjectPrefix += (spamConfig.settings?.flagSubjectPrefix || '[SPAM] ');
  if (isUrgent) subjectPrefix += '[URGENT] ';
  if (reviewResult.needsReview) subjectPrefix += (reviewConfig.settings?.flagSubjectPrefix || '[FLAGGED] ');

  // ------------------------------------------------------------------
  // 7. Admin email
  // ------------------------------------------------------------------
  try {
    const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    adminTemplate.submissionDate = formattedDate;
    adminTemplate.client = clientData;
    adminTemplate.request = requestData;
    adminTemplate.secEval = secEvalData;

    const adminHtmlBody = adminTemplate.evaluate().getContent();

    MailApp.sendEmail({
      to: adminEmail,
      replyTo: clientData.email !== 'N/A' ? clientData.email : adminEmail,
      subject: `${subjectPrefix}[New Enquiry] ${clientData.name} | ${requestData.helpCategory} — RD3 Tech`,
      htmlBody: adminHtmlBody
    });
    Logger.log('✅ Admin email sent');
  } catch (err) {
    Logger.log('❌ Admin email failed: ' + err.stack);
  }

  // ------------------------------------------------------------------
  // 8. Client email
  // ------------------------------------------------------------------
  if (clientData.email && clientData.email !== 'N/A') {
    try {
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
      Logger.log('✅ Client email sent');
    } catch (err) {
      Logger.log('⚠️ Client email failed: ' + err.message);
    }
  }
}

/**
 * Mock event for testing in the IDE
 */
function generateMockFormEvent() {
  return {
    response: {
      getRespondentEmail: function () { return 'test.client@example.com'; },
      getItemResponses: function () {
        return [
          { getItem: function () { return { getTitle: function () { return 'Name'; } }; }, getResponse: function () { return 'Jane Doe'; } },
          { getItem: function () { return { getTitle: function () { return 'Email'; } }; }, getResponse: function () { return 'jane.doe@example.com'; } },
          { getItem: function () { return { getTitle: function () { return 'Phone'; } }; }, getResponse: function () { return '021 123 4567'; } },
          { getItem: function () { return { getTitle: function () { return 'Address / Location:'; } }; }, getResponse: function () { return 'Whangarei'; } },
          { getItem: function () { return { getTitle: function () { return 'How would you prefer us to contact you?'; } }; }, getResponse: function () { return 'Email'; } },
          { getItem: function () { return { getTitle: function () { return 'Have you used RD3 Tech before?'; } }; }, getResponse: function () { return 'Yes'; } },
          { getItem: function () { return { getTitle: function () { return 'I am contacting RD3 Tech as:'; } }; }, getResponse: function () { return 'Home or Family'; } },
          { getItem: function () { return { getTitle: function () { return 'What can we help you with?'; } }; }, getResponse: function () { return 'Help with Something Broken?'; } },
          { getItem: function () { return { getTitle: function () { return 'What Are You Trying To Achieve?'; } }; }, getResponse: function () { return 'Need help with TV setup'; } },
          { getItem: function () { return { getTitle: function () { return 'How Urgent Is This For You?'; } }; }, getResponse: function () { return 'High'; } },
          { getItem: function () { return { getTitle: function () { return 'Website URL Security Check: Please leave this field empty.'; } }; }, getResponse: function () { return ''; } }
        ];
      }
    }
  };
}