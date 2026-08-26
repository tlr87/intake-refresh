/**
 * Test suite for verifying keyword analysis and live HTML rendering.
 */
function runAllTests() {
  Logger.log('==========================================');
  Logger.log('     STARTING KEYWORD CHECKER TESTS       ');
  Logger.log('==========================================');

  const testCases = [
    { name: 'Spam/SEO', text: 'Guest post services and backlinks for crypto projects.', expected: true },
    { name: 'Out of Scope TV', text: 'My TV screen has a display fault.', expected: true },
    { name: 'Valid IT Enquiry', text: 'Need help setting up Microsoft 365 and Wi-Fi.', expected: false },
    { name: 'Word Boundary Safeguard', text: 'Trying to improve productivity and activity.', expected: false }
  ];

  testCases.forEach((tc, idx) => {
    const res = checkReviewKeywords(tc.text);
    Logger.log(`Test ${idx + 1}: ${tc.name}`);
    Logger.log(`Needs Review? --> ${res.needsReview ? 'YES' : 'NO'}`);
    Logger.log(`Matched: [${res.matchedKeywords.join(', ')}]`);
    Logger.log('------------------------------------------');
  });
}

function testEmail() {
  MailApp.sendEmail("tom@rd3tech.com", "Test Subject", "Test Body");
}
undefined

function sendTestAdminEmail() {
  const testRecipient = 'tom@rd3tech.com';
  const mockGoal = 'My TV screen has a display fault and needs power repair.';
  
  const mockFields = [
    { title: 'Name', value: 'Jane Doe' },
    { title: 'Email', value: 'jane.doe@example.com' },
    { title: 'What Are You Trying To Achieve?', value: mockGoal }
  ];

  const reviewResult = checkReviewKeywords(mockGoal);

  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.name = 'Jane Doe';
  adminTemplate.userEmail = 'jane.doe@example.com';
  adminTemplate.fields = mockFields;
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;

  MailApp.sendEmail({
    to: testRecipient,
    subject: `[TEST] ${reviewResult.needsReview ? '[FLAGGED] ' : ''}New Enquiry — Jane Doe`,
    htmlBody: adminTemplate.evaluate().getContent()
  });

  Logger.log('Test email sent to ' + testRecipient);
}





/**
 * Test suite to verify checkReviewKeywords and getReviewConfig integration.
 */
function testKeywordCheckerStandalone() {
  Logger.log('==================================================');
  Logger.log('  TEST 1: Auto-Hydration via getReviewConfig()');
  Logger.log('==================================================');

  // 1. Test using default auto-loaded config (Script Properties or Fallback)
  const testInput1 = 'My TV screen has a display fault and power issues.';
  const result1 = checkReviewKeywords(testInput1);

  Logger.log('Input Text: "' + testInput1 + '"');
  Logger.log('Needs Review? --> ' + (result1.needsReview ? 'YES' : 'NO'));
  Logger.log('Matched Keywords: [' + result1.matchedKeywords.join(', ') + ']');

  if (result1.needsReview && result1.matchedKeywords.includes('tv screen')) {
    Logger.log('PASSED: Auto-hydration successfully loaded default outOfScope keywords.\n');
  } else {
    Logger.log('FAILED: Auto-hydration failed to evaluate input.\n');
  }

  Logger.log('==================================================');
  Logger.log('  TEST 2: Explicit Config Override');
  Logger.log('==================================================');

  // 2. Test passing a mock custom config object explicitly
  const mockCustomConfig = {
    settings: { enableReview: true },
    categories: {
      outOfScope: ['customkeyword', 'testphrase']
    }
  };

  const testInput2 = 'This string contains a customkeyword for testing.';
  const result2 = checkReviewKeywords(testInput2, mockCustomConfig);

  Logger.log('Input Text: "' + testInput2 + '"');
  Logger.log('Needs Review? --> ' + (result2.needsReview ? 'YES' : 'NO'));
  Logger.log('Matched Keywords: [' + result2.matchedKeywords.join(', ') + ']');

  if (result2.needsReview && result2.matchedKeywords.includes('customkeyword')) {
    Logger.log('PASSED: Custom config override executed correctly.');
  } else {
    Logger.log('FAILED: Custom config override failed.');
  }
  Logger.log('==================================================');
}








/**
 * Test function that trips Spam, Out-of-Scope, and Urgent filters simultaneously.
 * Run this function directly from the editor to test end-to-end email rendering.
 */
function testTripAllFilters() {
  Logger.log('==================================================');
  Logger.log('  STARTING TEST: TRIPPING ALL FILTER MODULES');
  Logger.log('==================================================');

  // 1. Crafted input payload designed to trigger all three filters:
  // - Out-of-Scope: "tv screen", "soldering"
  // - Spam: "casino", "http://"
  // - Urgent: "server down", "emergency"
  const testGoalText = "EMERGENCY: Our server down! Also need soldering for a tv screen. Check out http://casino.com for deals.";

  Logger.log('Test Input Payload:\n"' + testGoalText + '"\n');

  // 2. Load module configurations
  const formConfig = getFormConfig();
  const reviewConfig = getReviewConfig();
  const spamConfig = getSpamConfig();
  const urgencyConfig = getUrgencyConfig();

  const adminEmail = formConfig.settings ? formConfig.settings.adminEmail : 'tom@rd3tech.com';

  // 3. Evaluate inputs against keyword engines
  const reviewResult = checkReviewKeywords(testGoalText, reviewConfig);
  const spamResult = checkSpamKeywords(testGoalText, spamConfig);

  // Evaluate Urgency (Check if "High" level or keyword-driven)
  const isUrgentTest = testGoalText.toLowerCase().includes('emergency') || testGoalText.toLowerCase().includes('server down');

  // 4. Log evaluation results to Apps Script Execution Log
  Logger.log('--- EVALUATION RESULTS ---');
  Logger.log('1. Out-of-Scope Flagged? -> ' + (reviewResult.needsReview ? 'YES' : 'NO'));
  Logger.log('   Matched Keywords: [' + reviewResult.matchedKeywords.join(', ') + ']');
  
  Logger.log('2. Spam Flagged? ---------> ' + (spamResult.isSpam ? 'YES' : 'NO'));
  Logger.log('   Matched Spam: [' + spamResult.matchedKeywords.join(', ') + ']');

  Logger.log('3. Urgent Flagged? -------> ' + (isUrgentTest ? 'YES' : 'NO'));
  Logger.log('---------------------------\n');

  // 5. Construct subject line prefixes
  let subjectPrefix = '';
  if (spamResult.isSpam) subjectPrefix += '[SPAM] ';
  if (isUrgentTest) subjectPrefix += '[URGENT] ';
  if (reviewResult.needsReview) subjectPrefix += '[FLAGGED] ';

  // 6. Build mock field list for email payload
  const mockFields = [
    { title: 'Name', value: 'Test User (Multi-Filter)' },
    { title: 'Email', value: 'tester@example.com' },
    { title: 'How Urgent Is This For You?', value: 'High' },
    { title: 'What Are You Trying To Achieve?', value: testGoalText }
  ];

  // 7. Hydrate AdminEmail.html template
  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.name = 'Test User (Multi-Filter)';
  adminTemplate.userEmail = 'tester@example.com';
  adminTemplate.fields = mockFields;

  // Pass evaluation flags to HTML Template
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;
  
  adminTemplate.isSpam = spamResult.isSpam;
  adminTemplate.matchedSpamKeywords = spamResult.matchedKeywords;

  adminTemplate.isUrgent = isUrgentTest;

  const adminHtmlBody = adminTemplate.evaluate().getContent();

  // 8. Dispatch Test Email
  MailApp.sendEmail({
    to: adminEmail,
    subject: `${subjectPrefix}[New Enquiry] Test User — RD3 Tech`,
    htmlBody: adminHtmlBody
  });

  Logger.log('PASSED: Email dispatched to ' + adminEmail);
  Logger.log('Subject Sent: "' + `${subjectPrefix}[New Enquiry] Test User — RD3 Tech` + '"');
  Logger.log('==================================================');
}


/**
 * Simulates a live Google Form submission using the exact data from your pre-filled URL.
 * Includes detailed step-by-step diagnostic logging.
 */
function testPreFilledUrlSubmission() {
  Logger.log('======================================================================');
  Logger.log('  STARTING TEST: PRE-FILLED URL SIMULATED SUBMISSION');
  Logger.log('======================================================================');

  // 1. Step: Load Configurations
  Logger.log('[STEP 1/5] Loading system configurations...');
  const formConfig = getFormConfig();
  const reviewConfig = getReviewConfig();
  const spamConfig = getSpamConfig();
  const urgencyConfig = getUrgencyConfig();

  Logger.log(' - Admin Email Target: ' + (formConfig.settings ? formConfig.settings.adminEmail : 'Fallback/Default Email'));
  Logger.log(' - Review Filtering:  ' + (reviewConfig.settings ? reviewConfig.settings.enableReview : 'Enabled'));
  Logger.log(' - Spam Filtering:    ' + (spamConfig.settings ? spamConfig.settings.enableSpamCheck : 'Enabled'));

  // 2. Step: Prepare Mock Payload from Pre-Filled URL Parameters
  Logger.log('\n[STEP 2/5] Building mock submission payload from pre-filled URL data...');
  
  const mockFormValues = {
    name: "Tom Revill",
    email: "tom.revill@gmail.com",
    phone: "022 555 554",
    contactPreference: "Email",
    usedBefore: "Yes",
    clientType: "Home or Family",
    helpCategory: ["Help with Something Broken?"],
    userGoal: "TV is broken",
    urgency: "High"
  };

  Logger.log(' Input Values:');
  Logger.log('   - Name:               ' + mockFormValues.name);
  Logger.log('   - Email:              ' + mockFormValues.email);
  Logger.log('   - Phone:              ' + mockFormValues.phone);
  Logger.log('   - Contact Pref:       ' + mockFormValues.contactPreference);
  Logger.log('   - Existing Client:    ' + mockFormValues.usedBefore);
  Logger.log('   - Client Type:        ' + mockFormValues.clientType);
  Logger.log('   - Help Category:      ' + JSON.stringify(mockFormValues.helpCategory));
  Logger.log('   - User Goal:          "' + mockFormValues.userGoal + '"');
  Logger.log('   - Urgency Level:      ' + mockFormValues.urgency);

  const mockItemResponses = [
    createMockItemResponse(formConfig.fields.name.titleMatch, mockFormValues.name),
    createMockItemResponse(formConfig.fields.email.titleMatch, mockFormValues.email),
    createMockItemResponse(formConfig.fields.phone.titleMatch, mockFormValues.phone),
    createMockItemResponse(formConfig.fields.contactPreference.titleMatch, mockFormValues.contactPreference),
    createMockItemResponse(formConfig.fields.usedBefore.titleMatch, mockFormValues.usedBefore),
    createMockItemResponse(formConfig.fields.clientType.titleMatch, mockFormValues.clientType),
    createMockItemResponse(formConfig.fields.helpCategory.titleMatch, mockFormValues.helpCategory),
    createMockItemResponse(formConfig.fields.userGoal.titleMatch, mockFormValues.userGoal),
    createMockItemResponse(formConfig.fields.urgency.titleMatch, mockFormValues.urgency)
  ];

  const mockEvent = {
    response: {
      getRespondentEmail: function() { return mockFormValues.email; },
      getItemResponses: function() { return mockItemResponses; }
    }
  };

  // 3. Step: Standalone Keyword Engine Diagnostics
  Logger.log('\n[STEP 3/5] Running pre-execution moderation check on userGoal...');
  const reviewCheck = checkReviewKeywords(mockFormValues.userGoal, reviewConfig);
  const spamCheck = checkSpamKeywords(mockFormValues.userGoal, spamConfig);

  Logger.log(' Moderation Results:');
  Logger.log('   - Out-of-Scope Triggered? -> ' + (reviewCheck.needsReview ? 'YES' : 'NO'));
  Logger.log('     Matched Term(s):        [' + reviewCheck.matchedKeywords.join(', ') + ']');
  Logger.log('   - Spam Triggered? ---------> ' + (spamCheck.isSpam ? 'YES' : 'NO'));
  Logger.log('     Matched Term(s):        [' + spamCheck.matchedKeywords.join(', ') + ']');

  // 4. Step: Execute onFormSubmit
  Logger.log('\n[STEP 4/5] Executing onFormSubmit(e) handler...');
  try {
    onFormSubmit(mockEvent);
    Logger.log(' Handler execution completed without runtime errors.');
  } catch (err) {
    Logger.log(' ERROR: Handler threw an exception: ' + err.toString());
    return;
  }

  // 5. Step: Verify Subject Line Output
  Logger.log('\n[STEP 5/5] Subject line construction verification:');
  let expectedPrefix = '';
  if (spamCheck.isSpam) expectedPrefix += '[SPAM] ';
  if (mockFormValues.urgency === 'High') expectedPrefix += '[URGENT] ';
  if (reviewCheck.needsReview) expectedPrefix += '[FLAGGED] ';

  const expectedSubject = `${expectedPrefix}[New Enquiry] ${mockFormValues.name} — RD3 Tech`;
  Logger.log(' Expected Subject: "' + expectedSubject + '"');
  Logger.log(' Delivered To:     ' + (formConfig.settings ? formConfig.settings.adminEmail : 'tom@rd3tech.com') + ' & ' + mockFormValues.email);

  Logger.log('======================================================================');
  Logger.log('  TEST COMPLETE: Check execution log and inbox for verified email.');
  Logger.log('======================================================================');
}

/**
 * Helper to build mock Google Form ItemResponse objects.
 */
function createMockItemResponse(title, responseValue) {
  return {
    getItem: function() {
      return {
        getTitle: function() { return title; }
      };
    },
    getResponse: function() { return responseValue; }
  };
}





/**
 * Test function to verify that Honeypot detection cleanly aborts execution.
 */
function testHoneypotSilentDrop() {
  Logger.log('======================================================================');
  Logger.log('  STARTING TEST: HONEYPOT SILENT DROP VERIFICATION');
  Logger.log('======================================================================');

  const formConfig = getFormConfig();
  const honeypotTitle = formConfig.fields.honeypot ? formConfig.fields.honeypot.titleMatch : 'leave blank';

  // -------------------------------------------------------------------
  // CASE 1: BOT SUBMISSION (Honeypot Filled)
  // -------------------------------------------------------------------
  Logger.log('\n[CASE 1] Simulating Bot Submission (Honeypot filled)...');
  
  const botResponses = [
    createMockItemResponse(formConfig.fields.name.titleMatch, "Spam Bot"),
    createMockItemResponse(formConfig.fields.email.titleMatch, "spambot@example.com"),
    createMockItemResponse(formConfig.fields.userGoal.titleMatch, "Buy cheap products at http://spam.test"),
    createMockItemResponse(honeypotTitle, "http://spam-link.test") // <-- TRAP TRIPPED
  ];

  const botEvent = {
    response: {
      getRespondentEmail: function() { return "spambot@example.com"; },
      getItemResponses: function() { return botResponses; }
    }
  };

  Logger.log(' Executing onFormSubmit(e) with Honeypot data...');
  onFormSubmit(botEvent);
  Logger.log(' SUCCESS: Case 1 execution completed (Verify above logs show "Execution aborted").');

  // -------------------------------------------------------------------
  // CASE 2: HUMAN SUBMISSION (Honeypot Left Blank)
  // -------------------------------------------------------------------
  Logger.log('\n[CASE 2] Simulating Genuine Human Submission (Honeypot empty)...');
  
  const humanResponses = [
    createMockItemResponse(formConfig.fields.name.titleMatch, "Real User"),
    createMockItemResponse(formConfig.fields.email.titleMatch, "realuser@example.com"),
    createMockItemResponse(formConfig.fields.userGoal.titleMatch, "Need help setting up Wi-Fi router"),
    createMockItemResponse(honeypotTitle, "") // <-- CLEAN (EMPTY)
  ];

  const humanEvent = {
    response: {
      getRespondentEmail: function() { return "realuser@example.com"; },
      getItemResponses: function() { return humanResponses; }
    }
  };

  Logger.log(' Executing onFormSubmit(e) with clean submission...');
  onFormSubmit(humanEvent);
  Logger.log(' SUCCESS: Case 2 processed normally and dispatched email.');

  Logger.log('======================================================================');
  Logger.log('  HONEYPOT TEST COMPLETE');
  Logger.log('======================================================================');
}






/**
 * Test runner for doPost logic.
 * Run this directly inside the Apps Script Editor.
 */
function test_doPostSubmission() {
  // Construct mock event object matching a real web form payload
  const mockEvent = {
    parameter: {
      rd3_name: "Automation Tester",
      rd3_email: "tom@rd3tech.com",
      rd3_phone: "021 999 8888",
      rd3_contactPreference: "Email",
      rd3_usedBefore: "Yes",
      rd3_clientType: "Business",
      rd3_helpCategory: "General Inquiry",
      rd3_urgency: "Normal",
      rd3_userGoal: "This is a direct test execution from tests.gs to verify Google Form submission and emails."
    }
  };

  Logger.log("⏳ Starting direct doPost test...");
  
  // Call doPost directly
  const response = doPost(mockEvent);

  Logger.log("📥 Raw Response from doPost: " + response.getContent());
  Logger.log("✅ Test Execution Finished. Check your Google Form responses tab & tom@rd3tech.com inbox.");
}

/**
 * Test Invisible Honeypot Trap logic.
 * Verifies that hidden bot fields get caught without sending emails.
 */
function test_honeypotBotTrap() {
  const botEvent = {
    parameter: {
      rd3_name: "Spam Bot",
      rd3_email: "spammer@badsite.com",
      website_url: "http://spam-site.com/fake-link", // Honeypot field
      rd3_userGoal: "Buy cheap products now!"
    }
  };

  Logger.log("⏳ Testing Bot Trap...");
  const response = doPost(botEvent);
  Logger.log("📥 Bot Response (Should succeed silently without form entry): " + response.getContent());
}



/**
 * RD3 Tech Config Editor - Backend Integration Test
 * Run `testSaveAllConfigs()` directly inside the Apps Script Editor.
 */
function testSaveAllConfigs() {
  Logger.log("--- RUNNING BACKEND CONFIG SAVE TEST ---");
  
  const testPayload = {
    TEST_CONFIG_KEY: { testMode: true, timestamp: new Date().toISOString() }
  };
  
  try {
    // 1. Save test payload
    saveAllConfigs(testPayload);
    
    // 2. Read back from Script Properties
    const stored = PropertiesService.getScriptProperties().getProperty("TEST_CONFIG_KEY");
    const parsed = JSON.parse(stored);
    
    if (parsed && parsed.testMode === true) {
      Logger.log("✅ SUCCESS: Script Properties successfully updated and verified!");
    } else {
      Logger.log("❌ FAILURE: Retrieved property did not match expected test payload.");
    }
  } catch (e) {
    Logger.log("❌ ERROR during test execution: " + e.message);
  }
}




/**
 * END-TO-END TEST: Submits mock responses for all 11 configured fields
 * and sends a fully styled HTML admin notification email using AdminEmail.html.
 */
function testEndToEndFormFields() {
  Logger.log("=== STARTING END-TO-END FORM FIELD TEST ===");

  try {
    // 1. Fetch Configuration & Resolve Target Admin Email
    const store = PropertiesService.getScriptProperties();
    const rawConfig = store.getProperty('FORM_CONFIG');
    const formConfig = rawConfig ? JSON.parse(rawConfig) : getFallbackFormConfig();
    const fields = formConfig.fields || {};

    const adminEmail = (formConfig.settings && formConfig.settings.adminEmail)
      ? formConfig.settings.adminEmail
      : "tom@rd3tech.com";

    Logger.log("Notification Target: " + adminEmail);

    // 2. Open Form safely
    const formUrl = formConfig.settings.formBaseUrl;
    const formId = formUrl.match(/[-\w]{25,}/)[0];
    const form = FormApp.openById(formId);

    // 3. Define Mock Data Payload for all 11 fields
    const mockPayload = {
      honeypot: "",
      name: "Automation Field Tester",
      email: "test.automation@rd3tech.com",
      phone: "021 555 9999",
      address: "123 Test Street, Auckland, NZ",
      contactPreference: "Email",
      usedBefore: "No",
      clientType: "Business",
      helpCategory: ["IT Support & Infrastructure"],
      userGoal: "Automated end-to-end verification of form submission and AdminEmail.html rendering.",
      urgency: "High / Critical"
    };

    // 4. Populate Google Form Response & Array for HTML Template
    const formResponse = form.createResponse();
    const liveItems = form.getItems();
    const templateFields = [];
    let submittedCount = 0;

    liveItems.forEach(item => {
      const title = item.getTitle();
      const titleLower = title.trim().toLowerCase();

      const matchedKey = Object.keys(fields).find(key => {
        const titleMatch = (fields[key].titleMatch || '').trim().toLowerCase();
        return titleMatch && titleLower.includes(titleMatch);
      });

      if (!matchedKey) return;

      const itemType = item.getType();
      let itemResponse = null;
      let rawValue = mockPayload[matchedKey];

      switch (itemType) {
        case FormApp.ItemType.TEXT:
          rawValue = rawValue !== undefined ? rawValue : "Test Value";
          itemResponse = item.asTextItem().createResponse(rawValue);
          break;

        case FormApp.ItemType.PARAGRAPH_TEXT:
          rawValue = rawValue !== undefined ? rawValue : "Test Paragraph Value";
          itemResponse = item.asParagraphTextItem().createResponse(rawValue);
          break;

        case FormApp.ItemType.MULTIPLE_CHOICE:
          const mcChoices = item.asMultipleChoiceItem().getChoices();
          rawValue = mcChoices.length > 0 ? mcChoices[0].getValue() : "Option 1";
          itemResponse = item.asMultipleChoiceItem().createResponse(rawValue);
          break;

        case FormApp.ItemType.CHECKBOX:
          const cbChoices = item.asCheckboxItem().getChoices();
          rawValue = cbChoices.length > 0 ? [cbChoices[0].getValue()] : ["Option 1"];
          itemResponse = item.asCheckboxItem().createResponse(rawValue);
          break;

        case FormApp.ItemType.LIST:
          const listChoices = item.asListItem().getChoices();
          rawValue = listChoices.length > 0 ? listChoices[0].getValue() : "Option 1";
          itemResponse = item.asListItem().createResponse(rawValue);
          break;
      }

      if (itemResponse) {
        formResponse.withItemResponse(itemResponse);
        submittedCount++;
        
        // Push to templateFields array expected by AdminEmail.html
        templateFields.push({
          title: title,
          value: rawValue
        });
        
        Logger.log("✔ Mapped field [" + matchedKey + "] -> \"" + title + "\"");
      }
    });

    // 5. Submit Form Response
    formResponse.submit();
    Logger.log("✔ Form response submitted successfully (" + submittedCount + "/11 fields populated).");

    // 6. Bind Data to AdminEmail.html Template
    const htmlTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    htmlTemplate.name = mockPayload.name;
    htmlTemplate.userEmail = mockPayload.email;
    htmlTemplate.fields = templateFields;
    
    // Status flags to test banner rendering in HTML
    htmlTemplate.isSpam = false;
    htmlTemplate.isUrgent = true; // Displays the High Urgency orange banner
    htmlTemplate.needsReview = false;
    htmlTemplate.matchedSpamKeywords = [];
    htmlTemplate.matchedKeywords = [];

    const htmlOutput = htmlTemplate.evaluate().getContent();

    // 7. Dispatch HTML Email via MailApp
    MailApp.sendEmail({
      to: adminEmail,
      subject: "🚨 TEST SUBMISSION: New Form Enquiry Received (HTML Template Verified)",
      htmlBody: htmlOutput
    });

    Logger.log("✔ Styled HTML email successfully dispatched to " + adminEmail);
    Logger.log("\n--- TEST RESULT ---");
    Logger.log("✔ SUCCESS: All 11 fields processed, submitted, and rendered via AdminEmail.html!");

  } catch (err) {
    Logger.log("✖ ERROR during submission test: " + err.message);
  }
}






/**
 * CONSOLE TEST: Verifies disposable domains, suspicious TLDs, 
 * embedded URLs, and invalid contact character detection.
 */
function testSpamFilterPatterns() {
  Logger.log("=== STARTING ADVANCED SPAM FILTER PATTERN TEST ===");

  // Test Case 1: Clean/Legitimate Submission
  const cleanSubmission = {
    honeypot: "",
    name: "Thomas Miller",
    email: "tom@rd3tech.com",
    phone: "021 555 9999",
    address: "123 Queen Street, Auckland"
  };

  // Test Case 2: Multi-Vector Spam Submission
  const maliciousSubmission = {
    honeypot: "",
    name: "John Casino http://spam-site.com", // Embedded URL in name
    email: "spammer@mailinator.com",          // Disposable domain
    phone: "021 ABC 9999",                    // Alphabetical characters in phone
    address: "Visit us at claim-prize.xyz"    // Suspicious TLD (.xyz)
  };

  Logger.log("\n--- TEST 1: CLEAN SUBMISSION ---");
  const cleanResult = checkSpamKeywords(cleanSubmission);
  Logger.log("Is Spam: " + cleanResult.isSpam);
  if (!cleanResult.isSpam) {
    Logger.log("✔ PASS: Clean submission allowed through correctly.");
  } else {
    Logger.log("✖ FAIL: Clean submission was false-flagged!");
  }

  Logger.log("\n--- TEST 2: MALICIOUS SUBMISSION ---");
  const spamResult = checkSpamKeywords(maliciousSubmission);
  Logger.log("Is Spam: " + spamResult.isSpam);
  Logger.log("Matched Keywords: [" + spamResult.matchedKeywords.join(", ") + "]");
  Logger.log("Detection Reasons:");
  spamResult.reasons.forEach(reason => Logger.log("  • " + reason));

  if (spamResult.isSpam && spamResult.reasons.length >= 4) {
    Logger.log("\n✔ SUCCESS: All 4 structural spam vectors successfully caught!");
  } else {
    Logger.log("\n✖ FAIL: Some spam vectors were missed.");
  }
}










/**
 * TEST: Simulates a spam submission, runs it through the security pipeline,
 * and sends an Admin HTML email displaying the purple Spam Flagged banner.
 */
function testSendSpamAdminEmail() {
  Logger.log("=== STARTING SPAM ADMIN EMAIL TEST ===");

  try {
    // 1. Fetch Configuration for Admin Email Target
    const store = PropertiesService.getScriptProperties();
    const rawConfig = store.getProperty('FORM_CONFIG');
    const formConfig = rawConfig ? JSON.parse(rawConfig) : getFallbackFormConfig();

    const adminEmail = (formConfig.settings && formConfig.settings.adminEmail)
      ? formConfig.settings.adminEmail
      : "tom@rd3tech.com";

    Logger.log("Sending test email to: " + adminEmail);

    // 2. Define Mock Spam Submission Payload
    const mockSpamPayload = {
      honeypot: "",
      name: "John Casino http://spam-site.link",
      email: "spammer.test@mailinator.com",
      phone: "021 ABC 9999",
      address: "Claim your prize at 123 Spam Way .xyz",
      contactPreference: "Email",
      usedBefore: "No",
      clientType: "Business",
      helpCategory: ["IT Support & Infrastructure"],
      userGoal: "We offer top SEO rank services, wire money fast, and instant crypto rewards!",
      urgency: "Standard"
    };

    // 3. Run Security Checks (SpamFilter & KeywordChecker)
    const spamResult = checkSpamKeywords(mockSpamPayload);
    const reviewResult = checkReviewKeywords(mockSpamPayload);

    Logger.log("Security Check -> Is Spam: " + spamResult.isSpam);
    Logger.log("Matched Spam Keywords: " + spamResult.matchedKeywords.join(", "));

    // 4. Map Fields into Array for AdminEmail.html Template
    const templateFields = [
      { title: "Full Name", value: mockSpamPayload.name },
      { title: "Email Address", value: mockSpamPayload.email },
      { title: "Phone Number", value: mockSpamPayload.phone },
      { title: "Address / Location", value: mockSpamPayload.address },
      { title: "Preferred Contact Method", value: mockSpamPayload.contactPreference },
      { title: "Have you used RD3 Tech before?", value: mockSpamPayload.usedBefore },
      { title: "Client Type", value: mockSpamPayload.clientType },
      { title: "What do you need help with?", value: mockSpamPayload.helpCategory },
      { title: "What is your main goal or issue?", value: mockSpamPayload.userGoal },
      { title: "Urgency Level", value: mockSpamPayload.urgency }
    ];

    // 5. Populate AdminEmail.html Template Bindings
    const htmlTemplate = HtmlService.createTemplateFromFile('AdminEmail');
    htmlTemplate.name = mockSpamPayload.name;
    htmlTemplate.userEmail = mockSpamPayload.email;
    htmlTemplate.fields = templateFields;
    
    // Explicitly set security flags from filter results
    htmlTemplate.isSpam = spamResult.isSpam;
    htmlTemplate.matchedSpamKeywords = spamResult.matchedKeywords;
    htmlTemplate.isUrgent = false;
    htmlTemplate.needsReview = reviewResult.needsReview;
    htmlTemplate.matchedKeywords = reviewResult.matchedKeywords;

    const htmlOutput = htmlTemplate.evaluate().getContent();

    // 6. Dispatch Email to Admin
    MailApp.sendEmail({
      to: adminEmail,
      subject: "🚫 [SPAM ALERT TEST] Form Submission Flagged — RD3 Tech",
      htmlBody: htmlOutput
    });

    Logger.log("✔ SUCCESS: Spam alert email successfully dispatched to " + adminEmail);

  } catch (err) {
    Logger.log("✖ ERROR sending spam test email: " + err.message);
  }
}





function testPhoneSpamRules() {
  Logger.log("=== TESTING PHONE SPAM DETECTION RULES ===");

  const testCases = [
    { phone: "021 ABC 9999", expectedTag: "letters_in_phone" },
    { phone: "0000000000", expectedTag: "repetitive_phone" },
    { phone: "555", expectedTag: "fake_phone_pattern" },
    { phone: "12345678", expectedTag: "fake_phone_pattern" },
    { phone: "021 555 9999", expectedPass: true } // Valid NZ number
  ];

  testCases.forEach((tc, idx) => {
    const payload = {
      honeypot: "",
      name: "Test User",
      email: "test@rd3tech.com",
      phone: tc.phone,
      address: "Auckland"
    };

    const res = checkSpamKeywords(payload);
    Logger.log(`\nTest ${idx + 1} [Phone: "${tc.phone}"] -> Is Spam: ${res.isSpam}`);
    if (res.reasons.length > 0) Logger.log("Reason: " + res.reasons.join(", "));

    if (tc.expectedPass && !res.isSpam) {
      Logger.log("✔ PASS: Valid phone number allowed.");
    } else if (res.matchedKeywords.includes(tc.expectedTag)) {
      Logger.log(`✔ PASS: Correctly caught ${tc.expectedTag}!`);
    } else {
      Logger.log("✖ FAIL: Phone rule failed to trigger correctly.");
    }
  });
}

