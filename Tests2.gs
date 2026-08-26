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
