/**
 * Web App HTTP POST Endpoint for Custom HTML Website Forms.
 * Handles incoming requests, emails notifications, and optionally logs to Google Sheets.
 */
/**
 * Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 * Routes form submissions through standalone AdminEmail and ClientEmail HTML builders.
 */
/**
 * Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 * Uses local AdminEmail.html and ClientEmail.html files to render emails.
 */


/**
 * Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 * Uses local AdminEmail.html and ClientEmail.html files to render emails.
 */
/**
 * Web App HTTP POST Endpoint for RD3 Tech Website Forms.
 * Binds parameters directly to AdminEmail.html and ClientEmail.html templates.
 */
function doPost(e) {
  try {
    const formConfig = getFormConfig();
    const reviewConfig = getReviewConfig();
    const spamConfig = getSpamConfig();
    const adminEmail = (formConfig.settings && formConfig.settings.adminEmail) 
      ? formConfig.settings.adminEmail 
      : 'tom@rd3tech.com';

    // 1. Enhanced Parameter Parsing (Handles URL-Encoded, JSON, and Direct PostData)
    let params = {};
    if (e && e.postData && e.postData.contents) {
      const contentType = e.postData.type || '';
      if (contentType.indexOf('application/json') !== -1) {
        params = JSON.parse(e.postData.contents);
      } else if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
        params = parseQueryString(e.postData.contents);
      } else {
        params = e.parameter || parseQueryString(e.postData.contents);
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    // Extract core fields (supporting both standard and prefixed rd3_ field names)
    const name = params.rd3_name || params.name || params.Name || '';
    const userEmail = params.rd3_email || params.email || params.Email || '';
    const phone = params.rd3_phone || params.phone || params.Phone || '';
    const userGoal = params.rd3_userGoal || params.userGoal || params.message || params.comments || '';
    const selectedUrgency = params.rd3_urgency || params.urgency || params.Urgency || '';
    
    // Extract Invisible Honeypot field
    const honeypotValue = params.website_url || params.hp_comments || '';

    // 2. INVISIBLE HONEYPOT BOT TRAP
    if (honeypotValue && honeypotValue.trim() !== '') {
      Logger.log('🚫 WEB APP HONEYPOT TRIPPED: Bot submitted hidden website_url field.');
      return createJsonResponse({ status: "success", message: "Form submitted successfully." });
    }

    // 3. Structure field key-values for HTML email template rendering
    const fields = [
      { title: "Name", value: name },
      { title: "Email Address", value: userEmail },
      { title: "Phone", value: phone },
      { title: "Enquiry / Details", value: userGoal },
      { title: "Urgency Level", value: selectedUrgency }
    ];

    // 4. Run Moderation Filters
    const reviewResult = checkReviewKeywords(userGoal, reviewConfig);
    const spamResult = checkSpamKeywords(userGoal, spamConfig);
    const isUrgent = (selectedUrgency.toLowerCase() === 'high');

    // 5. Build Subject Line Prefixes
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

    // 6. Admin Email Dispatch
    const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    adminTemplate.name = name;
    adminTemplate.userEmail = userEmail;
    adminTemplate.fields = fields;
    adminTemplate.needsReview = reviewResult.needsReview;
    adminTemplate.matchedKeywords = reviewResult.matchedKeywords;
    adminTemplate.isSpam = spamResult.isSpam;
    adminTemplate.matchedSpamKeywords = spamResult.matchedKeywords;
    adminTemplate.isUrgent = isUrgent;

    const adminHtmlBody = adminTemplate.evaluate().getContent();

    MailApp.sendEmail({
      to: adminEmail,
      subject: `${subjectPrefix}[Website Enquiry] ${name ? name : 'Visitor'} — RD3 Tech`,
      htmlBody: adminHtmlBody
    });

    // 7. Client Confirmation Email Dispatch
    if (userEmail) {
      const clientTemplate = HtmlService.createTemplateFromFile('ClientEmail');
      clientTemplate.name = name;
      clientTemplate.fields = fields;

      const clientHtmlBody = clientTemplate.evaluate().getContent();

      MailApp.sendEmail({
        to: userEmail,
        subject: 'We received your website request — RD3 Tech',
        htmlBody: clientHtmlBody
      });
    }

    // 8. Return Success JSON Response to Website Front-End
    return createJsonResponse({ status: "success", message: "Enquiry sent successfully." });

  } catch (error) {
    Logger.log('ERROR in doPost web app handler: ' + error.toString());
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Helper to parse URL-encoded POST strings into an object
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

function doGet(e) {
  return createJsonResponse({ status: "active", service: "RD3 Tech API" });
}

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

function doGet(e) {
  return createJsonResponse({ status: "active", service: "RD3 Tech API" });
}

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

function doGet(e) {
  return createJsonResponse({ status: "active", service: "RD3 Tech API" });
}

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

function doGet(e) {
  return createJsonResponse({ status: "active", service: "RD3 Tech API" });
}

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
 * Handles HTTP GET Requests.
 */
function doGet(e) {
  return createJsonResponse({ status: "active", service: "RD3 Tech Web App API" });
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