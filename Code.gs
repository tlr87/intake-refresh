/**
 * Main form submission handler.
 * Reads configurations, evaluates submissions, and dispatches HTML emails.
 * 
 * @param {Object} e - The Google Form submission event object.
 */
function onFormSubmit(e) {
  const formConfig = getFormConfig();
  const reviewConfig = getReviewConfig();
  const spamConfig = getSpamConfig();

  const adminEmail = (formConfig.settings && formConfig.settings.adminEmail) 
    ? formConfig.settings.adminEmail 
    : 'tom@rd3tech.com';
  
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  const submitterEmailFromForm = formResponse.getRespondentEmail();

  let name = '';
  let extractedUserEmail = submitterEmailFromForm || '';
  let userGoal = '';
  let selectedUrgency = '';
  const fields = [];

  const nameTitle = formConfig.fields.name.titleMatch.toLowerCase();
  const emailTitle = formConfig.fields.email.titleMatch.toLowerCase();
  const goalTitle = formConfig.fields.userGoal.titleMatch.toLowerCase();
  const urgencyTitle = formConfig.fields.urgency ? formConfig.fields.urgency.titleMatch.toLowerCase() : 'urgency';

  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    const rawResponse = itemResponse.getResponse();
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes(nameTitle) && !name) {
      name = rawResponse;
    }

    if (lowerTitle.includes(emailTitle) && !extractedUserEmail) {
      extractedUserEmail = rawResponse;
    }

    if (lowerTitle.includes(goalTitle)) {
      userGoal = rawResponse;
    }

    if (lowerTitle.includes(urgencyTitle)) {
      selectedUrgency = String(rawResponse);
    }

    fields.push({
      title: title,
      value: Array.isArray(rawResponse) ? rawResponse : String(rawResponse)
    });
  });

  // Evaluate keywords for moderation, spam, and urgency
  const reviewResult = checkReviewKeywords(userGoal, reviewConfig);
  const spamResult = checkSpamKeywords(userGoal, spamConfig);
  const isUrgent = (selectedUrgency.toLowerCase() === 'high');

  // Build subject line prefixes dynamically
  let subjectPrefix = '';

  if (spamResult.isSpam) {
    const spamPrefix = (spamConfig.settings && spamConfig.settings.flagSubjectPrefix) 
      ? spamConfig.settings.flagSubjectPrefix 
      : '[SPAM] ';
    subjectPrefix += spamPrefix;
  }

  if (isUrgent) {
    subjectPrefix += '[URGENT] ';
  }

  if (reviewResult.needsReview) {
    const reviewPrefix = (reviewConfig.settings && reviewConfig.settings.flagSubjectPrefix) 
      ? reviewConfig.settings.flagSubjectPrefix 
      : '[FLAGGED] ';
    subjectPrefix += reviewPrefix;
  }

  // Send Admin Email
  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.name = name;
  adminTemplate.userEmail = extractedUserEmail;
  adminTemplate.fields = fields;

  // Evaluation parameters for template rendering
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;
  adminTemplate.isSpam = spamResult.isSpam;
  adminTemplate.matchedSpamKeywords = spamResult.matchedKeywords;
  adminTemplate.isUrgent = isUrgent;

  const adminHtmlBody = adminTemplate.evaluate().getContent();

  MailApp.sendEmail({
    to: adminEmail,
    subject: `${subjectPrefix}[New Enquiry] ${name ? name : 'Website Visitor'} — RD3 Tech`,
    htmlBody: adminHtmlBody
  });

  // Send Client Confirmation Email
  if (extractedUserEmail) {
    const clientTemplate = HtmlService.createTemplateFromFile('ClientEmail');
    clientTemplate.name = name;
    clientTemplate.fields = fields;

    const clientHtmlBody = clientTemplate.evaluate().getContent();

    MailApp.sendEmail({
      to: extractedUserEmail,
      subject: 'We received your request — RD3 Tech',
      htmlBody: clientHtmlBody
    });
  }
}

/**
 * Loads FORM_CONFIG from Script Properties or falls back to FallbackFormConfig.gs
 */
function getFormConfig() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('FORM_CONFIG');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger.log('Error parsing FORM_CONFIG: ' + e.message);
    }
  }
  return getFallbackFormConfig();
}

/**
 * Loads URGENCY_CONFIG from Script Properties or falls back to FallbackUrgencyConfig.gs
 */
function getUrgencyConfig() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('URGENCY_CONFIG');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      Logger.log('Error parsing URGENCY_CONFIG: ' + e.message);
    }
  }
  return getFallbackUrgencyConfig();
}