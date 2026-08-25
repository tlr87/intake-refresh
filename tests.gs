/**
 * Test function to verify checkReviewKeywords() without submitting the Google Form.
 * Select 'runKeywordTests' in the toolbar and click 'Run'.
 */
function runKeywordTests() {
  const testCases = [
    {
      label: "Test 1: Spam / Unrelated Enquiry (SEO & Crypto)",
      text: "Hi, we offer guest post services and backlinks to boost your rankings for crypto projects."
    },
    {
      label: "Test 2: Out of Scope Repair (TV & Electronics)",
      text: "My TV screen has a display fault and won't turn on. Do you fix TV power failure?"
    },
    {
      label: "Test 3: Mobile Hardware (Phone screen)",
      text: "I dropped my mobile phone screen and need a new charging port installed."
    },
    {
      label: "Test 4: Valid IT Enquiry (Should NOT flag)",
      text: "We need help setting up Microsoft 365 emails and configuring our Wi-Fi router for our small business."
    },
    {
      label: "Test 5: Short Word Boundary Test (Word containing 'tv')",
      text: "Our team is trying to improve productivity and activity in the office." // Should NOT trigger "tv"
    }
  ];

  Logger.log("==========================================");
  Logger.log("     STARTING KEYWORD CHECKER TESTS       ");
  Logger.log("==========================================\n");

  testCases.forEach((test, index) => {
    const result = checkReviewKeywords(test.text);
    
    Logger.log(`--- ${test.label} ---`);
    Logger.log(`Input Text: "${test.text}"`);
    Logger.log(`Needs Review? --> ${result.needsReview ? "YES (FLAGGED)" : "NO (CLEAN)"}`);
    Logger.log(`Matched Keywords: [${result.matchedKeywords.join(", ")}]`);
    Logger.log("------------------------------------------\n");
  });

  Logger.log("==========================================");
  Logger.log("            TESTS COMPLETED               ");
  Logger.log("==========================================");
}







/**
 * Sends a live test email of AdminEmail.html directly to tom@rd3tech.com.
 * Select 'sendTestAdminEmail' in the Apps Script toolbar and click 'Run'.
 */
function sendTestAdminEmail() {
  const testRecipient = 'tom@rd3tech.com';
  
  // 1. Mock Form Input Data (simulating a flagged TV repair request)
  const mockName = 'Jane Doe';
  const mockEmail = 'jane.doe@example.com';
  const mockUserGoal = 'My TV screen has a display fault and needs a new TV panel or power repair.';
  
  const mockFields = [
    { title: 'Name', value: 'Jane Doe' },
    { title: 'Email', value: 'jane.doe@example.com' },
    { title: 'Phone', value: '021 555 0199' },
    { title: 'How would you prefer us to contact you?', value: 'Email' },
    { title: 'Have you used RD3 Tech before?', value: 'No' },
    { title: 'I am contacting RD3 Tech as:', value: 'Home or Family' },
    { 
      title: 'What can we help you with?', 
      value: ['Help with Something Broken?', 'Help with Knowing Where to Start?'] 
    },
    { title: 'What Are You Trying To Achieve?', value: mockUserGoal },
    { title: 'How Urgent Is This For You?', value: 'High' }
  ];

  // 2. Run Keyword Evaluation using KeywordChecker.gs
  const reviewResult = checkReviewKeywords(mockUserGoal);

  // 3. Populate AdminEmail.html template
  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.name = mockName;
  adminTemplate.userEmail = mockEmail;
  adminTemplate.fields = mockFields;
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;

  const htmlBody = adminTemplate.evaluate().getContent();

  // 4. Send the test email
  MailApp.sendEmail({
    to: testRecipient,
    subject: `[TEST] ${reviewResult.needsReview ? '[FLAGGED] ' : ''}New Enquiry — Jane Doe`,
    htmlBody: htmlBody
  });

  Logger.log(`Test email sent successfully to ${testRecipient}! Check your inbox.`);
}