/**
 * Tests.gs
 * Suite of test functions to verify doPost, keyword moderation,
 * rate limiting, and email rendering directly from the Apps Script IDE.
 */

/**
 * 1. MAIN TEST: Simulates an incoming POST request to doPost()
 * Run this function from the top toolbar dropdown in Apps Script.
 */
function test_doPost_SuccessfulSubmission() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        rd3_name: "John Test",
        rd3_email: "test.user@example.com",
        rd3_phone: "555-0199",
        rd3_contactPreference: "Email",
        rd3_usedBefore: "No",
        rd3_clientType: "Potential Client",
        rd3_helpCategory: "Web Development",
        rd3_urgency: "Normal",
        rd3_userGoal: "Automated test submission to confirm WebAppHandler pipeline."
      })
    }
  };

  Logger.log("--- STARTING DOPOST TEST ---");
  const response = doPost(mockEvent);
  Logger.log("Response Output: " + response.getContent());
}

/**
 * 2. SPAM / HONEYPOT TEST: Verifies that honeypot fields silently trap bot submissions.
 */
function test_doPost_HoneypotTrigger() {
  const mockSpamEvent = {
    postData: {
      contents: JSON.stringify({
        rd3_name: "Spam Bot",
        rd3_email: "spammer@bot.com",
        website_url: "http://spam-link.com", // Honeypot field filled
        rd3_userGoal: "Buy cheap backlinks now!"
      })
    }
  };

  Logger.log("--- STARTING HONEYPOT TEST ---");
  const response = doPost(mockSpamEvent);
  Logger.log("Response Output (Should succeed silently): " + response.getContent());
}

/**
 * 3. OUT-OF-SCOPE KEYWORD TEST: Tests checkReviewKeywords using out-of-scope criteria.
 */
function test_KeywordChecker_OutOfScope() {
  const samplePayload = {
    rd3_name: "Jane Hardware",
    rd3_userGoal: "My TV panel has a display fault and I need soldering for an Xbox console."
  };

  Logger.log("--- STARTING KEYWORD CHECK TEST ---");
  const reviewResult = checkReviewKeywords(samplePayload);
  Logger.log("Needs Review: " + reviewResult.needsReview);
  Logger.log("Matched Keywords: " + JSON.stringify(reviewResult.matchedKeywords));
}

/**
 * 4. EMAIL TEMPLATE RENDER TEST: Verifies secEval object structure against AdminEmail.html.
 */
function test_AdminEmail_TemplateRender() {
  try {
    const template = HtmlService.createTemplateFromFile('AdminEmail');
    template.name = "Test User";
    template.userEmail = "test@example.com";
    template.fields = [
      { title: "Name", value: "Test User" },
      { title: "Help Category", value: "Web Development" }
    ];
    template.secEval = {
      isSpam: false,
      requiresReview: true,
      reviewFlags: ["PlayStation", "TV panel"],
      spamFlags: []
    };
    template.isUrgent = false;

    const htmlOutput = template.evaluate().getContent();
    Logger.log("--- ADMIN EMAIL TEMPLATE RENDER SUCCESS ---");
    Logger.log("Generated HTML Length: " + htmlOutput.length + " characters.");
  } catch (err) {
    Logger.log("❌ ADMIN EMAIL TEMPLATE FAILED: " + err.toString());
  }
}

/**
 * Test runner for doPost pipeline using exact client-facing form fields.
 */
function test_doPost_ClientFormSubmission() {
  Logger.log("--- STARTING CLIENT FORM DOPOST TEST ---");

  // Mock POST event payload mapping directly to your client form fields
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        // Your Details
        rd3_name: "Jane Smith",
        rd3_email: "tom.revill@gmail.com",
        rd3_phone: "021-555-0199",
        rd3_location: "Auckland, New Zealand",
        rd3_contactPreference: "Email", // Options: "Email" | "Phone"
        rd3_usedBefore: "No",            // Options: "Yes" | "No"
        rd3_clientType: "Small Business", // Options: "Home or Family" | "Small Business" | "Community Group"

        // How Can We Help?
        rd3_helpCategory: "Help with Something Better?", // Matches your dropdown/radio situation
        
        // What Are You Trying To Achieve?
        rd3_userGoal: "We want to upgrade our office Wi-Fi setup and sync our team files securely across remote devices.",
        
        // How Urgent Is This For You?
        rd3_urgency: "Medium", // Options: "Low" | "Medium" | "High"

        // Honeypot Field (Should remain empty for real submissions)
        website_url: ""
      })
    }
  };

  // Execute the doPost function with mock event
  const response = doPost(mockEvent);
  
  // Log the raw response output
  Logger.log("Response Output: " + response.getContent());
}




/**
 * ============================================================================
 * ADMIN EMAIL VISUAL TEST
 * ============================================================================
 *
 * Sends a test AdminEmail directly to the configured admin address.
 *
 * Expected status badges:
 *   [ SPAM DETECTED ]
 *   [ REQUIRES REVIEW ]
 *   [ URGENT REQUEST ]
 *
 * CLEAN should NOT appear.
 *
 * This test:
 *   - DOES send an email
 *   - DOES NOT submit to the Google Form
 *   - DOES NOT send a ClientEmail
 *   - DOES NOT run the website endpoint
 *   - DOES use the real AdminEmail.html template
 *   - DOES use the real AdminEmail styling
 * ============================================================================
 */
function testAdminEmailAllBadges() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — ADMIN EMAIL VISUAL TEST');
  Logger.log('============================================================');

  // Get the configured admin email.
  const formConfig = (typeof getFormConfig === 'function')
    ? getFormConfig()
    : {};

  const adminEmail =
    (formConfig.settings && formConfig.settings.adminEmail)
      ? formConfig.settings.adminEmail
      : 'tom@rd3tech.com';

  Logger.log('Sending test AdminEmail to: ' + adminEmail);

  // --------------------------------------------------------------------------
  // TEST DATA
  // --------------------------------------------------------------------------

  const name = 'Badge Test Client';
  const userEmail = 'test@example.com';
  const phone = '021 000 0000';
  const location = 'Whangārei';
  const pref = 'Email';
  const usedBefore = 'No';
  const clientType = 'Business';

  const category = 'Help with Something Better';

  const userGoal =
    'I need guest post services and crypto backlinks for my website.';

  const selectedUrgency = 'High';

  const submissionDate =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss z'
    );

  // --------------------------------------------------------------------------
  // STRUCTURED FIELDS
  // --------------------------------------------------------------------------

  const fields = [
    { title: 'Name', value: name },
    { title: 'Email Address', value: userEmail },
    { title: 'Phone', value: phone },
    { title: 'Address / Location', value: location },
    { title: 'Preferred Contact', value: pref },
    { title: 'Used RD3 Tech Before', value: usedBefore },
    { title: 'Contacting As', value: clientType },
    { title: 'Help Category', value: category },
    { title: 'Urgency Level', value: selectedUrgency },
    { title: 'Enquiry / Details', value: userGoal }
  ];

  // --------------------------------------------------------------------------
  // REQUEST OBJECT
  // --------------------------------------------------------------------------

  const request = {
    helpCategory: category,
    situation: category,
    userGoal: userGoal,
    goal: userGoal,
    urgency: selectedUrgency,
    timeframe: selectedUrgency
  };

  // --------------------------------------------------------------------------
  // CLIENT OBJECT
  // --------------------------------------------------------------------------

  const client = {
    name: name,
    email: userEmail,
    phone: phone,
    location: location,
    contactPreference: pref,
    preferredContact: pref,
    contactingAs: clientType,
    usedBefore: false,
    isPreviousCustomer: false
  };

  // --------------------------------------------------------------------------
  // FORCE ALL THREE STATUS CONDITIONS
  // --------------------------------------------------------------------------

  const secEval = {
    // SPAM badge
    isSpam: true,

    // REVIEW badge
    requiresReview: true,

    // Details shown inside Spam box
    spamFlags: [
      'guest post',
      'backlinks'
    ],

    // Details shown inside Review box
    reviewFlags: [
      'crypto'
    ],

    // Compatibility with any template logic using matchedKeywords
    matchedKeywords: [
      'crypto'
    ],

    // Compatibility with the fallback flags logic
    flags: [
      'SPAM: guest post',
      'SPAM: backlinks',
      'REVIEW: crypto'
    ]
  };

  // --------------------------------------------------------------------------
  // URGENCY
  // --------------------------------------------------------------------------

  const isUrgent = true;

  // --------------------------------------------------------------------------
  // BUILD REAL ADMIN TEMPLATE
  // --------------------------------------------------------------------------

  const adminTemplate =
    HtmlService.createTemplateFromFile('AdminEmail');

  adminTemplate.name = name;
  adminTemplate.userEmail = userEmail;
  adminTemplate.fields = fields;
  adminTemplate.submissionDate = submissionDate;

  adminTemplate.request = request;
  adminTemplate.client = client;
  adminTemplate.secEval = secEval;
  adminTemplate.isUrgent = isUrgent;

  // --------------------------------------------------------------------------
  // SEND TEST EMAIL
  // --------------------------------------------------------------------------

  MailApp.sendEmail({
    to: adminEmail,
    subject: '[TEST] Admin Email — All Status Badges',
    htmlBody: adminTemplate.evaluate().getContent()
  });

  Logger.log('============================================================');
  Logger.log('TEST EMAIL SENT');
  Logger.log('============================================================');
  Logger.log('Recipient: ' + adminEmail);
  Logger.log('');
  Logger.log('Expected badges:');
  Logger.log('  ✓ SPAM DETECTED');
  Logger.log('  ✓ REQUIRES REVIEW');
  Logger.log('  ✓ URGENT REQUEST');
  Logger.log('');
  Logger.log('Expected badge NOT present:');
  Logger.log('  ✓ CLEAN');
  Logger.log('============================================================');
}












/**
 * ============================================================================
 * CLIENT EMAIL — NORMAL VISUAL TEST
 * ============================================================================
 *
 * Sends a normal ClientEmail directly to the admin/test recipient.
 *
 * This test:
 *   - DOES send an email
 *   - DOES use the real ClientEmail.html template
 *   - DOES NOT submit anything to Google Forms
 *   - DOES NOT send an AdminEmail
 *   - DOES NOT run doPost()
 *   - DOES NOT include badges, alerts, spam, review or urgency information
 *
 * Change TEST_EMAIL below to the address where you want to receive the test.
 * ============================================================================
 */
function testClientEmailNormal() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — CLIENT EMAIL NORMAL TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // TEST RECIPIENT
  // --------------------------------------------------------------------------

  const TEST_EMAIL = 'tom.revill@gmail.com';

  // --------------------------------------------------------------------------
  // NORMAL TEST DATA
  // --------------------------------------------------------------------------

  const name = 'Jane Smith';
  const userEmail = TEST_EMAIL;
  const phone = '021 123 4567';
  const location = 'Whangārei';
  const pref = 'Email';
  const usedBefore = 'No';
  const clientType = 'Business';

  const category = 'Help with Something Better';

  const userGoal =
    'I would like to improve my current computer setup and make it easier to manage my day-to-day work.';

  const selectedUrgency = 'Medium';

  const submissionDate =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss z'
    );

  // --------------------------------------------------------------------------
  // STRUCTURED FIELDS
  // --------------------------------------------------------------------------

  const fields = [
    { title: 'Name', value: name },
    { title: 'Email Address', value: userEmail },
    { title: 'Phone', value: phone },
    { title: 'Address / Location', value: location },
    { title: 'Preferred Contact', value: pref },
    { title: 'Used RD3 Tech Before', value: usedBefore },
    { title: 'Contacting As', value: clientType },
    { title: 'Help Category', value: category },
    { title: 'Urgency Level', value: selectedUrgency },
    { title: 'Enquiry / Details', value: userGoal }
  ];

  // --------------------------------------------------------------------------
  // CLIENT OBJECT
  // --------------------------------------------------------------------------

  const client = {
    name: name,
    email: userEmail,
    phone: phone,
    location: location,
    contactPreference: pref,
    preferredContact: pref,
    contactingAs: clientType,
    usedBefore: false,
    isPreviousCustomer: false
  };

  // --------------------------------------------------------------------------
  // REQUEST OBJECT
  // --------------------------------------------------------------------------

  const request = {
    helpCategory: category,
    situation: category,
    userGoal: userGoal,
    goal: userGoal,
    urgency: selectedUrgency,
    timeframe: selectedUrgency
  };

  // --------------------------------------------------------------------------
  // CLEAN CATEGORY FOR SUBJECT
  // --------------------------------------------------------------------------

  const cleanCategory =
    category.replace(/^Help with\s+/i, '').trim();

  // --------------------------------------------------------------------------
  // BUILD CLIENT EMAIL TEMPLATE
  // --------------------------------------------------------------------------

  const clientTemplate =
    HtmlService.createTemplateFromFile('ClientEmail');

  clientTemplate.name = name;
  clientTemplate.fields = fields;
  clientTemplate.submissionDate = submissionDate;

  clientTemplate.client = client;
  clientTemplate.request = request;

  // --------------------------------------------------------------------------
  // SEND
  // --------------------------------------------------------------------------

  MailApp.sendEmail({
    to: TEST_EMAIL,
    replyTo: 'tom@rd3tech.com',
    subject:
      `Thanks ${name}, we’ll be in touch to help you with ${cleanCategory} | RD3 Tech`,
    htmlBody: clientTemplate.evaluate().getContent()
  });

  // --------------------------------------------------------------------------
  // LOG
  // --------------------------------------------------------------------------

  Logger.log('============================================================');
  Logger.log('CLIENT TEST EMAIL SENT');
  Logger.log('============================================================');
  Logger.log('Recipient: ' + TEST_EMAIL);
  Logger.log('Name: ' + name);
  Logger.log('Category: ' + cleanCategory);
  Logger.log('Urgency: ' + selectedUrgency);
  Logger.log('');
  Logger.log('Expected result:');
  Logger.log('  ✓ Normal client email');
  Logger.log('  ✓ No badges');
  Logger.log('  ✓ No alerts');
  Logger.log('  ✓ No spam information');
  Logger.log('  ✓ No review information');
  Logger.log('  ✓ No urgency warning');
  Logger.log('  ✓ Logo/header displayed');
  Logger.log('  ✓ What happens next section displayed');
  Logger.log('============================================================');
}







/**
 * ============================================================================
 * ADMIN EMAIL — NORMAL VISUAL TEST
 * ============================================================================
 *
 * Directly renders the real AdminEmail.html template using a clean,
 * non-spam, non-review, non-urgent test submission.
 *
 * DOES:
 *   - Render AdminEmail.html
 *   - Provide all variables required by the template
 *   - Send the rendered email
 *
 * DOES NOT:
 *   - Run doPost()
 *   - Submit a Google Form
 *   - Run spam detection
 *   - Run review detection
 *   - Run urgency evaluation
 *   - Send ClientEmail
 *
 * ============================================================================
 */
function testAdminEmailNormal() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — ADMIN EMAIL NORMAL TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // TEST RECIPIENT
  // --------------------------------------------------------------------------

  const TEST_EMAIL = 'tom@rd3tech.com';

  // --------------------------------------------------------------------------
  // TEST SUBMISSION
  // --------------------------------------------------------------------------

  const name = 'Jane Smith';
  const userEmail = 'jane.smith@example.com';
  const phone = '021 123 4567';
  const location = 'Whangārei';

  const pref = 'Email';
  const usedBefore = 'No';
  const clientType = 'Small Business';

  const category = 'Help with Something Better';

  const userGoal =
    'I would like to improve my current computer setup and make it easier to manage my day-to-day work.';

  const selectedUrgency = 'Medium';

  const submissionDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss z'
  );

  // --------------------------------------------------------------------------
  // CLIENT OBJECT
  // --------------------------------------------------------------------------

  const client = {
    name: name,
    email: userEmail,
    phone: phone,
    location: location,
    contactPreference: pref,
    preferredContact: pref,
    contactingAs: clientType,
    usedBefore: false,
    isPreviousCustomer: false
  };

  // --------------------------------------------------------------------------
  // REQUEST OBJECT
  // --------------------------------------------------------------------------

  const request = {
    helpCategory: category,
    situation: category,
    userGoal: userGoal,
    goal: userGoal,
    urgency: selectedUrgency,
    timeframe: selectedUrgency
  };

  // --------------------------------------------------------------------------
  // SECURITY / EVALUATION OBJECT
  // --------------------------------------------------------------------------

  const secEval = {
    // Overall security state
    isSpam: false,

    // Scope/review state
    requiresReview: false,

    // Explicit spam keyword matches
    spamFlags: [],

    // Explicit review/out-of-scope keyword matches
    reviewFlags: [],

    // Generic matched keywords
    matchedKeywords: [],

    // Combined flags
    flags: []
  };

  // --------------------------------------------------------------------------
  // FIELDS
  // --------------------------------------------------------------------------

  const fields = [
    { title: 'Name', value: name },
    { title: 'Email Address', value: userEmail },
    { title: 'Phone', value: phone },
    { title: 'Address / Location', value: location },
    { title: 'Preferred Contact', value: pref },
    { title: 'Used RD3 Tech Before', value: usedBefore },
    { title: 'Contacting As', value: clientType },
    { title: 'Help Category', value: category },
    { title: 'Urgency Level', value: selectedUrgency },
    { title: 'Enquiry / Details', value: userGoal }
  ];

  // --------------------------------------------------------------------------
  // LOAD ADMIN TEMPLATE
  // --------------------------------------------------------------------------

  Logger.log('Loading AdminEmail.html...');

  const template =
    HtmlService.createTemplateFromFile('AdminEmail');

  // --------------------------------------------------------------------------
  // PROVIDE TEMPLATE VARIABLES
  // --------------------------------------------------------------------------

  template.name = name;
  template.fields = fields;
  template.submissionDate = submissionDate;

  template.client = client;
  template.request = request;
  template.secEval = secEval;

  // --------------------------------------------------------------------------
  // RENDER TEMPLATE
  // --------------------------------------------------------------------------

  Logger.log('Rendering AdminEmail.html...');

  const html =
    template
      .evaluate()
      .getContent();

  Logger.log('Template rendered successfully.');
  Logger.log('HTML length: ' + html.length);

  // --------------------------------------------------------------------------
  // SUBJECT
  // --------------------------------------------------------------------------

  const cleanCategory =
    category
      .replace(/^Help with\s+/i, '')
      .trim();

  const subject =
    'New Enquiry — ' +
    name +
    ' | ' +
    cleanCategory +
    ' | ' +
    selectedUrgency;

  // --------------------------------------------------------------------------
  // SEND EMAIL
  // --------------------------------------------------------------------------

  Logger.log('Sending email...');

  MailApp.sendEmail({
    to: TEST_EMAIL,
    replyTo: userEmail,
    subject: subject,
    htmlBody: html
  });

  // --------------------------------------------------------------------------
  // LOG RESULT
  // --------------------------------------------------------------------------

  Logger.log('============================================================');
  Logger.log('ADMIN EMAIL NORMAL TEST SUCCESSFUL');
  Logger.log('============================================================');

  Logger.log('Recipient: ' + TEST_EMAIL);
  Logger.log('Customer: ' + name);
  Logger.log('Customer Email: ' + userEmail);
  Logger.log('Phone: ' + phone);
  Logger.log('Location: ' + location);
  Logger.log('Preferred Contact: ' + pref);
  Logger.log('Previous Client: ' + usedBefore);
  Logger.log('Client Type: ' + clientType);
  Logger.log('Category: ' + category);
  Logger.log('Urgency: ' + selectedUrgency);

  Logger.log('');
  Logger.log('SECURITY TEST STATE');
  Logger.log('Spam: ' + secEval.isSpam);
  Logger.log('Review: ' + secEval.requiresReview);
  Logger.log('Spam Flags: ' + JSON.stringify(secEval.spamFlags));
  Logger.log('Review Flags: ' + JSON.stringify(secEval.reviewFlags));
  Logger.log('Matched Keywords: ' + JSON.stringify(secEval.matchedKeywords));

  Logger.log('');
  Logger.log('Expected email appearance:');
  Logger.log('  ✓ CLEAN badge');
  Logger.log('  ✓ Passed Automated Checks');
  Logger.log('  ✓ No SPAM DETECTED badge');
  Logger.log('  ✓ No REQUIRES REVIEW badge');
  Logger.log('  ✓ No URGENT REQUEST badge');
  Logger.log('  ✓ Customer details');
  Logger.log('  ✓ Submission details');
  Logger.log('  ✓ Help category');
  Logger.log('  ✓ Client goal');
  Logger.log('  ✓ Internal Execution Principles');
  Logger.log('  ✓ RD3 Tech header/footer');

  Logger.log('============================================================');
}