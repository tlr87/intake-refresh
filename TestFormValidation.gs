/**
 * Core validation function. 
 * Audits FORM_CONFIG against live Google Form items while filtering structural headers.
 */
function runFormValidationFromUi() {
  const details = [];
  let totalConfigured = 0;
  let passed = 0;
  let failed = 0;
  let unaccounted = 0;

  try {
    // 1. Fetch Configuration
    const store = PropertiesService.getScriptProperties();
    const rawConfig = store.getProperty('FORM_CONFIG');
    const formConfig = rawConfig ? JSON.parse(rawConfig) : getFallbackFormConfig();
    const fields = formConfig.fields || {};
    const formUrl = formConfig.settings ? formConfig.settings.formBaseUrl : '';

    if (!formUrl) {
      throw new Error("No formBaseUrl found in configuration.");
    }

    // 2. Extract Form ID safely using Regex
    const idMatch = formUrl.match(/[-\w]{25,}/);
    if (!idMatch) {
      throw new Error("Could not extract a valid Form ID from URL: " + formUrl);
    }
    const formId = idMatch[0];

    // 3. Open Form
    let form;
    try {
      form = FormApp.openById(formId);
    } catch (err) {
      throw new Error("Unable to open Google Form (ID: " + formId + "). Check permissions.");
    }

    // 4. Validate Configured Fields
    const liveItems = form.getItems();
    const liveItemTitles = liveItems.map(item => item.getTitle().trim().toLowerCase());
    const configuredKeys = Object.keys(fields);
    totalConfigured = configuredKeys.length;

    details.push("--- CONFIGURATION VERIFICATION ---");
    configuredKeys.forEach(key => {
      const field = fields[key];
      const matchTitle = (field.titleMatch || '').trim().toLowerCase();

      const foundInLive = liveItemTitles.some(title => title.includes(matchTitle));
      if (foundInLive) {
        passed++;
        details.push("✔ PASS [" + key + "]: Matched title pattern \"" + field.titleMatch + "\"");
      } else {
        failed++;
        details.push("✖ FAIL [" + key + "]: Title pattern \"" + field.titleMatch + "\" not found in live form");
      }
    });

    // 5. Audit Unaccounted Items (Filtering non-input structural elements)
    const STRUCTURAL_TYPES = [
      FormApp.ItemType.SECTION_HEADER,
      FormApp.ItemType.PAGE_BREAK,
      FormApp.ItemType.IMAGE,
      FormApp.ItemType.VIDEO
    ];

    details.push("\n--- UNACCOUNTED LIVE FORM ITEMS ---");
    liveItems.forEach(item => {
      // Skip non-input elements
      if (STRUCTURAL_TYPES.includes(item.getType())) {
        return;
      }

      const title = item.getTitle();
      const titleLower = title.trim().toLowerCase();
      const isConfigured = configuredKeys.some(key => {
        const matchTitle = (fields[key].titleMatch || '').trim().toLowerCase();
        return titleLower.includes(matchTitle);
      });

      if (!isConfigured) {
        unaccounted++;
        details.push("⚠️ UNACCOUNTED: Live Form item \"" + title + "\" (ID: " + item.getId() + ") is not in config.");
      }
    });

    if (unaccounted === 0) {
      details.push("✔ All live input fields are accounted for.");
    }

  } catch (err) {
    details.push("ERROR: " + err.message);
    failed = totalConfigured;
  }

  return {
    totalConfigured: totalConfigured,
    passed: passed,
    failed: failed,
    unaccounted: unaccounted,
    details: details
  };
}

/**
 * Console Test Runner: Select from toolbar dropdown and click Run.
 */
function testFormValidationConsole() {
  const result = runFormValidationFromUi();
  
  Logger.log("=== FORM VALIDATION TEST RESULT ===");
  Logger.log("Total Configured: " + result.totalConfigured);
  Logger.log("Passed: " + result.passed);
  Logger.log("Failed: " + result.failed);
  Logger.log("Unaccounted: " + result.unaccounted);
  Logger.log("\n--- DETAILED LOGS ---");
  result.details.forEach(line => Logger.log(line));
}