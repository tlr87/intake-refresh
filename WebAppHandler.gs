/**
 * Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 * Traps spam, limits repeat submissions, records to Google Form, and dispatches HTML emails.
 */
function doPost(e) {
  try {
    Logger.log("Incoming parameter payload: " + JSON.stringify(e));

    // Get configuration settings if helper functions exist
    const formConfig = (typeof getFormConfig === 'function') ? getFormConfig() : {};
    const reviewConfig = (typeof getReviewConfig === 'function') ? getReviewConfig() : {};
    const spamConfig = (typeof getSpamConfig === 'function') ? getSpamConfig() : {};
    const rateLimitConfig = (typeof getRateLimitConfig === 'function') ? getRateLimitConfig() : { enabled: true, cooldownSeconds: 60 };
    
    const adminEmail = (formConfig.settings && formConfig.settings.adminEmail) 
      ? formConfig.settings.adminEmail 
      : 'tom@rd3tech.com';

    // 1. Parameter Extraction
    let params = {};
    if (e && e.parameter && Object.keys(e.parameter).length > 0) {
      params = e.parameter;
    } else if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        params = parseQueryString(e.postData.contents);
      }
    }

    // Core Fields
    const name = params.rd3_name || params.name || params.Name || 'Visitor';
    const userEmail = (params.rd3_email || params.email || params.Email || '').trim().toLowerCase();
    const phone = params.rd3_phone || params.phone || params.Phone || 'Not provided';
    const pref = params.rd3_contactPreference || params.contactPreference || 'Email';
    const usedBefore = params.rd3_usedBefore || params.usedBefore || 'Not provided';
    const clientType = params.rd3_clientType || params.clientType || 'Not provided';
    const category = params.rd3_helpCategory || params.helpCategory || params.category || 'General Inquiry';
    const userGoal = params.rd3_userGoal || params.userGoal || params.message || params.comments || 'No details provided.';
    const selectedUrgency = params.rd3_urgency || params.urgency || params.Urgency || 'Normal';
    
    // Submission Timestamp
    const submissionDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss z");

    // Honeypot Check
    const honeypotValue = params.website_url || params.hp_comments || '';
    if (honeypotValue && honeypotValue.trim() !== '') {
      Logger.log('🚫 HONEYPOT TRIPPED');
      return createJsonResponse({ status: "success", message: "Form submitted successfully." });
    }

    // Rate Limiting / Cooldown Check
    if (rateLimitConfig.enabled && userEmail) {
      const cache = CacheService.getScriptCache();
      const cacheKey = "rl_" + Utilities.base64Encode(userEmail);
      const isCooldown = cache.get(cacheKey);

      if (isCooldown) {
        Logger.log('⏱️ RATE LIMIT TRIGGERED for: ' + userEmail);
        return createJsonResponse({ 
          status: "error", 
          message: `Please wait ${rateLimitConfig.cooldownSeconds || 60} seconds before submitting another request.` 
        });
      }

      cache.put(cacheKey, "active", rateLimitConfig.cooldownSeconds || 60);
    }

    // 2. Record to Google Form
    try {
      const FORM_ID = '10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc';
      const form = FormApp.openById(FORM_ID);
      const formResponse = form.createResponse();
      const items = form.getItems();

      const responseMap = {
        name: name,
        email: userEmail,
        phone: phone,
        pref: pref,
        usedBefore: usedBefore,
        clientType: clientType,
        category: category,
        urgency: selectedUrgency,
        goal: userGoal
      };

      let submittedAnswers = 0;

      items.forEach(function(item) {
        const itemType = item.getType();
        const title = item.getTitle().toLowerCase().trim();
        let valueToSubmit = null;

        if (title.indexOf('name') !== -1) valueToSubmit = responseMap.name;
        else if (title.indexOf('email') !== -1) valueToSubmit = responseMap.email;
        else if (title.indexOf('phone') !== -1) valueToSubmit = responseMap.phone;
        else if (title.indexOf('contact') !== -1 || title.indexOf('prefer') !== -1) valueToSubmit = responseMap.pref;
        else if (title.indexOf('used') !== -1 || title.indexOf('before') !== -1) valueToSubmit = responseMap.usedBefore;
        else if (title.indexOf('client') !== -1 || title.indexOf('as') !== -1) valueToSubmit = responseMap.clientType;
        else if (title.indexOf('category') !== -1 || title.indexOf('help') !== -1) valueToSubmit = responseMap.category;
        else if (title.indexOf('urgency') !== -1) valueToSubmit = responseMap.urgency;
        else if (title.indexOf('goal') !== -1 || title.indexOf('enquiry') !== -1 || title.indexOf('achieve') !== -1 || title.indexOf('details') !== -1) valueToSubmit = responseMap.goal;

        if (valueToSubmit) {
          try {
            if (itemType === FormApp.ItemType.TEXT) {
              formResponse.withItemResponse(item.asTextItem().createResponse(valueToSubmit));
              submittedAnswers++;
            } else if (itemType === FormApp.ItemType.PARAGRAPH_TEXT) {
              formResponse.withItemResponse(item.asParagraphTextItem().createResponse(valueToSubmit));
              submittedAnswers++;
            } else if (itemType === FormApp.ItemType.MULTIPLE_CHOICE) {
              const mcItem = item.asMultipleChoiceItem();
              const validChoices = mcItem.getChoices().map(c => c.getValue());
              const match = validChoices.find(c => c.toLowerCase().includes(valueToSubmit.toLowerCase()));
              const finalChoice = match || validChoices[0];
              formResponse.withItemResponse(mcItem.createResponse(finalChoice));
              submittedAnswers++;
            } else if (itemType === FormApp.ItemType.LIST) {
              const listItem = item.asListItem();
              const validChoices = listItem.getChoices().map(c => c.getValue());
              const match = validChoices.find(c => c.toLowerCase().includes(valueToSubmit.toLowerCase()));
              const finalChoice = match || validChoices[0];
              formResponse.withItemResponse(listItem.createResponse(finalChoice));
              submittedAnswers++;
            }
          } catch(e) {
            Logger.log("Could not set value for field [" + item.getTitle() + "]: " + e.toString());
          }
        }
      });

      if (submittedAnswers > 0) {
        formResponse.submit();
        Logger.log("✅ Successfully recorded " + submittedAnswers + " responses into Google Form.");
      }

    } catch (formErr) {
      Logger.log('❌ Google Form logging error: ' + formErr.toString());
    }

    // 3. Moderation Checks
    const reviewResult = (typeof checkReviewKeywords === 'function') 
      ? checkReviewKeywords(userGoal, reviewConfig) 
      : { needsReview: false, matchedKeywords: [] };

    const spamResult = (typeof checkSpamKeywords === 'function') 
      ? checkSpamKeywords(userGoal, spamConfig) 
      : { isSpam: false, matchedKeywords: [] };

    const isUrgent = (selectedUrgency.toLowerCase().indexOf('high') !== -1 || selectedUrgency.toLowerCase() === 'urgent');

    // 4. Subject Line Prefixes
    let subjectPrefix = '';
    if (spamResult.isSpam) {
      subjectPrefix += (spamConfig.settings && spamConfig.settings.flagSubjectPrefix) 
        ? spamConfig.settings.flagSubjectPrefix : '[SPAM] ';
    }
    if (isUrgent) {
      subjectPrefix += '[URGENT] ';
    }
    if (reviewResult.needsReview) {
      subjectPrefix += (reviewConfig.settings && reviewConfig.settings.flagSubjectPrefix) 
        ? reviewConfig.settings.flagSubjectPrefix : '[FLAGGED] ';
    }

    // 5. Structure Fields Array
    const fields = [
      { title: "Name", value: name },
      { title: "Email Address", value: userEmail },
      { title: "Phone", value: phone },
      { title: "Preferred Contact", value: pref },
      { title: "Used RD3 Tech Before", value: usedBefore },
      { title: "Contacting As", value: clientType },
      { title: "Help Category", value: category },
      { title: "Urgency Level", value: selectedUrgency },
      { title: "Enquiry / Details", value: userGoal }
    ];

    // 6. Admin Email Dispatch
    const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    adminTemplate.name = name;
    adminTemplate.userEmail = userEmail;
    adminTemplate.fields = fields;
    adminTemplate.submissionDate = submissionDate;

    // Provide the request object expected by AdminEmail.html
    adminTemplate.request = {
      situation: category,
      goal: userGoal,
      timeframe: selectedUrgency
    };

    // Provide the client object expected by AdminEmail.html
    adminTemplate.client = {
      name: name,
      email: userEmail,
      phone: phone,
      preferredContact: pref,
      contactingAs: clientType,
      isPreviousCustomer: usedBefore
    };

    // Provide the secEval object expected by AdminEmail.html
    adminTemplate.secEval = {
      isSpam: spamResult.isSpam,
      requiresReview: reviewResult.needsReview,
      reviewFlags: reviewResult.matchedKeywords,
      spamFlags: spamResult.matchedKeywords
    };

    adminTemplate.isUrgent = isUrgent;

    MailApp.sendEmail({
      to: adminEmail,
      subject: `${subjectPrefix}[Website Enquiry] ${name} — ${category}`,
      htmlBody: adminTemplate.evaluate().getContent()
    });

    // 7. Client Email Dispatch
    if (userEmail && userEmail.indexOf('@') !== -1) {
      const clientTemplate = HtmlService.createTemplateFromFile('ClientEmail');
      clientTemplate.name = name;
      clientTemplate.fields = fields;
      clientTemplate.submissionDate = submissionDate;

      // Provide the client object expected by ClientEmail.html
      clientTemplate.client = {
        name: name,
        email: userEmail,
        phone: phone,
        preferredContact: pref,
        contactingAs: clientType,
        isPreviousCustomer: usedBefore
      };

      // Provide the request object expected by ClientEmail.html
      clientTemplate.request = {
        situation: category,
        goal: userGoal,
        timeframe: selectedUrgency
      };

      MailApp.sendEmail({
        to: userEmail,
        subject: 'We received your website request — RD3 Tech',
        htmlBody: clientTemplate.evaluate().getContent()
      });
    }

    return createJsonResponse({ status: "success", message: "Enquiry sent successfully." });

  } catch (error) {
    Logger.log('❌ FATAL ERROR in doPost: ' + error.toString());
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Saves form submission data if a Google Sheet is bound to the script.
 */
function saveToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  let sheet = ss.getSheetByName('Submissions');
  if (!sheet) {
    sheet = ss.insertSheet('Submissions');
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Phone', 'Preferred Contact',
      'Used Before', 'Client Type', 'Category', 'Urgency', 'Goal / Outcome'
    ]);
  }

  sheet.appendRow([
    data.timestamp, data.name, data.email, data.phone, data.pref,
    data.usedBefore, data.clientType, data.category, data.urgency, data.goal
  ]);
}

/**
 * Helper to parse URL-encoded POST strings.
 */
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

/**
 * Utility helper to build JSON outputs.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTML Escaping utility helper.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}