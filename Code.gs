/**
 * Run this function ONCE to set up the automatic form submission trigger.
 */
function setupFormTrigger() {
  const form = FormApp.getActiveForm();
  
  // Clear any existing triggers for this project to avoid duplicate emails
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Install a new onFormSubmit trigger
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();
    
  Logger.log('Form submission trigger installed successfully!');
}

/**
 * Automatically runs whenever a user submits the Google Form.
 */
function onFormSubmit(e) {
  const adminEmail = 'tom@rd3tech.com';
  
  const formResponse = e.response;
  const itemResponses = formResponse.getItemResponses();
  const submitterEmailFromForm = formResponse.getRespondentEmail();
  
  let name = '';
  let extractedUserEmail = submitterEmailFromForm || '';
  let userGoal = '';
  const fields = [];

  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    const rawResponse = itemResponse.getResponse();
    
    if (title.toLowerCase().includes('name') && !name) {
      name = rawResponse;
    }
    
    if (title.toLowerCase().includes('email') && !extractedUserEmail) {
      extractedUserEmail = rawResponse;
    }

    if (title.includes('What Are You Trying To Achieve?')) {
      userGoal = rawResponse;
    }

    fields.push({
      title: title,
      value: Array.isArray(rawResponse) ? rawResponse : String(rawResponse)
    });
  });

  // Run keyword analysis
  const reviewResult = checkReviewKeywords(userGoal);

  // Send Admin Email
  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.name = name;
  adminTemplate.userEmail = extractedUserEmail;
  adminTemplate.fields = fields;
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;
  
  const adminHtmlBody = adminTemplate.evaluate().getContent();

  MailApp.sendEmail({
    to: adminEmail,
    subject: `${reviewResult.needsReview ? '[FLAGGED] ' : ''}[New Enquiry] ${name ? name : 'Website Visitor'} — RD3 Tech`,
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