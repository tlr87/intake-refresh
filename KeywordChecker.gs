/**
 * Scans the "What Are You Trying To Achieve?" field against a single array of keywords
 * to flag submission for manual review or spam filtering.
 */
function checkReviewKeywords(userGoal) {
  if (!userGoal) {
    return { needsReview: false, matchedKeywords: [] };
  }

  // List of keywords/phrases to flag
  const reviewKeywords = [
    "tv",
    "TV",
    "Tuned",
    "Tv Tuned",
    "crypto",
    "seo",
    "guest post",
    "backlinks",
    "rankings",
    "partnership",
    "TV screen",
    "TV panel",
    "Display fault",
    "TV power failure",
    "Internal TV component",
    "Antenna",
    "TV reception",
    "Mobile phone screen",
    "Mobile phone battery",
    "Charging port",
    "Water damage",
    "Tablet screen",
    "Soldering",
    "Component-level electronics",
    "Console hardware",
    "PlayStation",
    "Xbox",
    "Nintendo",
    "Appliance",
    "Whiteware",
    "Electrical wiring",
    "General electronics",
    "Manufacturer warranty service"
  ];

  const matchedKeywords = [];
  const textToSearch = userGoal.toLowerCase();

  // Deduplicate and convert reviewKeywords to lowercase for accurate matching
  const uniqueLowerKeywords = [...new Set(reviewKeywords.map(k => k.toLowerCase()))];

  for (const keyword of uniqueLowerKeywords) {
    // Regex matches exact words or multi-word phrases safely
    const regex = new RegExp('\\b' + escapeRegExp(keyword) + '\\b', 'i');
    if (regex.test(textToSearch)) {
      matchedKeywords.push(keyword);
    }
  }

  return {
    needsReview: matchedKeywords.length > 0,
    matchedKeywords: matchedKeywords
  };
}

/**
 * Escapes special regex characters in keywords
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Implementation inside your main onFormSubmit function
 */
function onFormSubmit(e) {
  const itemResponses = e.response.getItemResponses();
  let userGoal = '';

  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    if (title.includes('What Are You Trying To Achieve?')) {
      userGoal = itemResponse.getResponse();
    }
  });

  // Perform keyword review check
  const reviewResult = checkReviewKeywords(userGoal);

  // Example usage: Pass flags into Admin email template
  const adminTemplate = HtmlService.createTemplateFromFile('AdminEmail');
  adminTemplate.needsReview = reviewResult.needsReview;
  adminTemplate.matchedKeywords = reviewResult.matchedKeywords;

  Logger.log('Needs Review: ' + reviewResult.needsReview);
  Logger.log('Matched Keywords: ' + reviewResult.matchedKeywords.join(', '));
}