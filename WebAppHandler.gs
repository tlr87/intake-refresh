/**
 * Configuration Constants
 */
const CONFIG = {
  DEFAULT_ADMIN_EMAIL: 'tom@rd3tech.com',
  GOOGLE_FORM_ID: '10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc',
  DEFAULT_COOLDOWN_SEC: 60
};

/**
 * Main Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 */
function doPost(e) {
  try {
    Logger.log("Incoming parameter payload: " + JSON.stringify(e));

    // 1. Ingest Configuration & Raw Parameters
    const configs = loadConfigurations();
    const rawParams = parseIncomingParameters(e);

    // 2. Centralized Payload & Schema Extraction
    const { payload, displaySchema } = mapFormPayload(rawParams);
    const userEmail = (payload.client?.email || '').toLowerCase();
    
    // 3. Security & Gatekeeping Checks
    if (isHoneypotTripped(rawParams)) {
      Logger.log('🚫 HONEYPOT TRIPPED');
      return createJsonResponse({ status: "success", message: "Form submitted successfully." });
    }

    if (isRateLimited(userEmail, configs.rateLimit)) {
      Logger.log('⏱️ RATE LIMIT TRIGGERED for: ' + userEmail);
      const cooldown = configs.rateLimit.cooldownSeconds || CONFIG.DEFAULT_COOLDOWN_SEC;
      return createJsonResponse({ 
        status: "error", 
        message: `Please wait ${cooldown} seconds before submitting another request.` 
      });
    }

    // 4. Execution Pipeline (Individual Try/Catch Guards)
    const formSuccess = recordToGoogleForm(payload);
    const moderation = evaluateModeration(payload, configs);
    
    const adminEmail = configs.form.settings?.adminEmail || CONFIG.DEFAULT_ADMIN_EMAIL;
    const adminSent = sendAdminEmail(payload, displaySchema, moderation, adminEmail);
    const clientSent = sendClientConfirmation(payload, displaySchema, adminEmail);

    // Save to Sheet if bound active spreadsheet exists
    saveToSheet(payload);

    return createJsonResponse({ 
      status: "success", 
      message: "Enquiry sent successfully.",
      diagnostics: { formSuccess, adminSent, clientSent }
    });

  } catch (error) {
    Logger.log('❌ FATAL ERROR in doPost: ' + error.toString());
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// ==========================================
// INGESTION & GATEKEEPING HELPERS
// ==========================================

function loadConfigurations() {
  return {
    form: (typeof getFormConfig === 'function') ? getFormConfig() : {},
    review: (typeof getReviewConfig === 'function') ? getReviewConfig() : {},
    spam: (typeof getSpamConfig === 'function') ? getSpamConfig() : {},
    rateLimit: (typeof getRateLimitConfig === 'function') 
      ? getRateLimitConfig() 
      : { enabled: true, cooldownSeconds: CONFIG.DEFAULT_COOLDOWN_SEC }
  };
}

function parseIncomingParameters(e) {
  if (e?.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }
  if (e?.postData?.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      return parseQueryString(e.postData.contents);
    }
  }
  return {};
}

function isHoneypotTripped(rawParams) {
  const honeypot = rawParams.website_url || rawParams.hp_comments || '';
  return honeypot.trim() !== '';
}

function isRateLimited(userEmail, rateLimitConfig) {
  if (!rateLimitConfig.enabled || !userEmail || userEmail === 'not provided') {
    return false;
  }
  const cache = CacheService.getScriptCache();
  const cacheKey = "rl_" + Utilities.base64Encode(userEmail);
  
  if (cache.get(cacheKey)) {
    return true;
  }

  const cooldown = rateLimitConfig.cooldownSeconds || CONFIG.DEFAULT_COOLDOWN_SEC;
  cache.put(cacheKey, "active", cooldown);
  return false;
}

// ==========================================
// STORAGE & INTEGRATION HELPERS
// ==========================================

function recordToGoogleForm(payload) {
  try {
    const form = FormApp.openById(CONFIG.GOOGLE_FORM_ID);
    const formResponse = form.createResponse();
    const items = form.getItems();

    const category = payload.request.situation || 'General Inquiry';
    const selectedUrgency = payload.request.timeframe || 'Normal';

    const responseMap = {
      name: payload.client.name,
      email: payload.client.email,
      phone: payload.client.phone,
      location: payload.client.location,
      pref: payload.client.preferredContact,
      usedBefore: payload.client.isPreviousCustomer,
      clientType: payload.client.contactingAs,
      category: category,
      urgency: selectedUrgency,
      goal: payload.request.goal
    };

    let submittedAnswers = 0;

    items.forEach(item => {
      const itemType = item.getType();
      const title = item.getTitle().toLowerCase().trim();
      let valueToSubmit = null;

      if (title.includes('name')) valueToSubmit = responseMap.name;
      else if (title.includes('email')) valueToSubmit = responseMap.email;
      else if (title.includes('phone')) valueToSubmit = responseMap.phone;
      else if (title.includes('location') || title.includes('address')) valueToSubmit = responseMap.location;
      else if (title.includes('contact') || title.includes('prefer')) valueToSubmit = responseMap.pref;
      else if (title.includes('used') || title.includes('before')) valueToSubmit = responseMap.usedBefore;
      else if (title.includes('client') || title.includes('as')) valueToSubmit = responseMap.clientType;
      else if (title.includes('category') || title.includes('help')) valueToSubmit = responseMap.category;
      else if (title.includes('urgency')) valueToSubmit = responseMap.urgency;
      else if (title.includes('goal') || title.includes('enquiry') || title.includes('achieve') || title.includes('details')) valueToSubmit = responseMap.goal;

      if (valueToSubmit) {
        try {
          if (itemType === FormApp.ItemType.TEXT) {
            formResponse.withItemResponse(item.asTextItem().createResponse(valueToSubmit));
            submittedAnswers++;
          } else if (itemType === FormApp.ItemType.PARAGRAPH_TEXT) {
            formResponse.withItemResponse(item.asParagraphTextItem().createResponse(valueToSubmit));
            submittedAnswers++;
          } else if (itemType === FormApp.ItemType.MULTIPLE_CHOICE || itemType === FormApp.ItemType.LIST) {
            const choiceItem = itemType === FormApp.ItemType.MULTIPLE_CHOICE ? item.asMultipleChoiceItem() : item.asListItem();
            const validChoices = choiceItem.getChoices().map(c => c.getValue());
            const match = validChoices.find(c => c.toLowerCase().includes(valueToSubmit.toLowerCase()));
            const finalChoice = match || validChoices[0];
            formResponse.withItemResponse(choiceItem.createResponse(finalChoice));
            submittedAnswers++;
          }
        } catch (err) {
          Logger.log(`Could not set value for field [${item.getTitle()}]: ${err.toString()}`);
        }
      }
    });

    if (submittedAnswers > 0) {
      formResponse.submit();
      Logger.log(`✅ Successfully recorded ${submittedAnswers} responses into Google Form.`);
      return true;
    }
  } catch (formErr) {
    Logger.log('❌ Google Form logging error: ' + formErr.toString());
  }
  return false;
}

function saveToSheet(payload) {
  const SPREADSHEET_ID = '1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g';
  
  try {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log('No active spreadsheet found. Opening by ID: ' + SPREADSHEET_ID);
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }

    let sheet = ss.getSheetByName('Submissions');
    if (!sheet) {
      Logger.log('Sheet "Submissions" missing. Creating it...');
      sheet = ss.insertSheet('Submissions');
      sheet.appendRow([
        'Timestamp', 'Name', 'Email', 'Phone', 'Location', 'Preferred Contact',
        'Client Type', 'Used Before', 'Category', 'Goal / Outcome', 'Urgency'
      ]);
    }

    const client = payload.client || {};
    const request = payload.request || {};

    sheet.appendRow([
      payload.submissionDate || new Date(),
      client.name || 'N/A',
      client.email || 'N/A',
      client.phone || 'N/A',
      client.location || 'N/A',
      client.contactPreference || client.preferredContact || 'N/A',
      client.contactingAs || 'N/A',
      client.usedBefore === true ? 'Yes' : (client.usedBefore === false ? 'No' : (client.usedBefore || 'N/A')),
      request.helpCategory || request.situation || 'N/A',
      request.userGoal || request.goal || 'N/A',
      request.urgency || request.timeframe || 'N/A'
    ]);

    Logger.log('✅ Wrote to sheet successfully: ' + ss.getName());
    return true;

  } catch (err) {
    Logger.log('❌ EXCEPTION IN saveToSheet: ' + err.toString());
    return false;
  }
}

// ==========================================
// MODERATION & EMAIL HELPERS
// ==========================================

function evaluateModeration(payload, configs) {
  const reviewResult = (typeof checkReviewKeywords === 'function') 
    ? checkReviewKeywords(payload, configs.review) 
    : { needsReview: false, matchedKeywords: [] };

  const spamResult = (typeof checkSpamKeywords === 'function') 
    ? checkSpamKeywords(payload, configs.spam) 
    : { isSpam: false, matchedKeywords: [] };

  const selectedUrgency = payload.request.timeframe || 'Normal';
  const isUrgent = selectedUrgency.toLowerCase().includes('high') || selectedUrgency.toLowerCase() === 'urgent';

  let subjectPrefix = '';
  if (spamResult.isSpam) {
    subjectPrefix += configs.spam.settings?.flagSubjectPrefix || '[SPAM] ';
  }
  if (isUrgent) {
    subjectPrefix += '[URGENT] ';
  }
  if (reviewResult.needsReview) {
    subjectPrefix += configs.review.settings?.flagSubjectPrefix || '[FLAGGED] ';
  }

  return { reviewResult, spamResult, isUrgent, subjectPrefix };
}

function buildLegacyFieldsArray(payload) {
  return [
    { title: "Name", value: payload.client.name },
    { title: "Email Address", value: payload.client.email },
    { title: "Phone", value: payload.client.phone },
    { title: "Address / Location", value: payload.client.location },
    { title: "Preferred Contact", value: payload.client.preferredContact },
    { title: "Used RD3 Tech Before", value: payload.client.isPreviousCustomer },
    { title: "Contacting As", value: payload.client.contactingAs },
    { title: "Help Category", value: payload.request.situation || 'General Inquiry' },
    { title: "Urgency Level", value: payload.request.timeframe || 'Normal' },
    { title: "Enquiry / Details", value: payload.request.goal }
  ];
}

function sendAdminEmail(payload, displaySchema, moderation, adminEmail) {
  try {
    const userEmail = payload.client.email;
    const name = payload.client.name;
    const category = payload.request.situation || 'General Inquiry';
    
    const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    adminTemplate.name = name;
    adminTemplate.userEmail = userEmail;
    adminTemplate.fields = buildLegacyFieldsArray(payload);
    adminTemplate.submissionDate = payload.submissionDate;
    adminTemplate.displaySchema = displaySchema;
    adminTemplate.request = payload.request;
    adminTemplate.client = payload.client;
    adminTemplate.isUrgent = moderation.isUrgent;
    adminTemplate.secEval = {
      isSpam: moderation.spamResult.isSpam,
      requiresReview: moderation.reviewResult.needsReview,
      reviewFlags: moderation.reviewResult.matchedKeywords,
      spamFlags: moderation.spamResult.matchedKeywords
    };

    MailApp.sendEmail({
      to: adminEmail,
      replyTo: (userEmail && userEmail !== 'not provided') ? userEmail : adminEmail,
      subject: `${moderation.subjectPrefix}[Website Enquiry] ${name} — ${category}`,
      htmlBody: adminTemplate.evaluate().getContent()
    });
    return true;
  } catch (err) {
    Logger.log('❌ Admin Email Error: ' + err.toString());
    return false;
  }
}

function sendClientConfirmation(payload, displaySchema, adminEmail) {
  const userEmail = payload.client.email;
  if (!userEmail || !userEmail.includes('@')) return false;

  try {
    const name = payload.client.name;
    const category = payload.request.situation || 'General Inquiry';
    const cleanCategory = category.replace(/^Help with\s+/i, '').trim();

    const clientTemplate = HtmlService.createTemplateFromFile('ClientEmail');
    clientTemplate.name = name;
    clientTemplate.fields = buildLegacyFieldsArray(payload);
    clientTemplate.submissionDate = payload.submissionDate;
    clientTemplate.displaySchema = displaySchema;
    clientTemplate.client = payload.client;
    clientTemplate.request = payload.request;

    MailApp.sendEmail({
      to: userEmail,
      replyTo: adminEmail,
      subject: `Thanks ${name}, we’ll be in touch to help you with ${cleanCategory} | RD3 Tech`,
      htmlBody: clientTemplate.evaluate().getContent()
    });
    return true;
  } catch (err) {
    Logger.log('❌ Client Email Error: ' + err.toString());
    return false;
  }
}

// ==========================================
// UTILITY HELPERS
// ==========================================

function parseQueryString(queryString) {
  const params = {};
  if (!queryString) return params;
  const pairs = queryString.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    const key = decodeURIComponent(pair[0]);
    const value = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
    if (key) params[key] = value;
  }
  return params;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}