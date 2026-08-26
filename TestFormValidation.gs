/**
 * Web-accessible wrapper to trigger form validation from the Config Editor UI.
 */
function runFormValidationFromUi() {
  return executeFormValidationTest();
}

/**
 * Standalone runner for Apps Script Editor Console.
 */
function testFormValidation() {
  var res = executeFormValidationTest();
  Logger.log(res.details.join('\n'));
}

/**
 * Core validation logic returning both logs and structured metrics.
 */
function executeFormValidationTest() {
  var logs = [];
  function log(msg) {
    logs.push(msg);
  }

  log("==================================================");
  log("STARTING FORM FIELD ENTRY ID VALIDATION TEST");
  log("==================================================");

  var config = getInitialData().FORM_CONFIG || getFallbackFormConfig();
  var formUrl = config.settings ? config.settings.formBaseUrl : null;

  if (!formUrl) {
    log("❌ ERROR: No 'formBaseUrl' defined in settings.");
    return { success: false, totalConfigured: 0, passed: 0, failed: 1, unaccounted: 0, details: logs };
  }

  log("Fetching Google Form HTML from:\n" + formUrl + "\n");
  var htmlContent = "";
  try {
    var response = UrlFetchApp.fetch(formUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      log("❌ HTTP ERROR: Received response code " + response.getResponseCode());
      return { success: false, totalConfigured: 0, passed: 0, failed: 1, unaccounted: 0, details: logs };
    }
    htmlContent = response.getContentText();
  } catch (e) {
    log("❌ FETCH ERROR: " + e.toString());
    return { success: false, totalConfigured: 0, passed: 0, failed: 1, unaccounted: 0, details: logs };
  }

  var match = htmlContent.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
  if (!match || !match[1]) {
    log("❌ ERROR: Failed to extract internal form schema from Form HTML.");
    return { success: false, totalConfigured: 0, passed: 0, failed: 1, unaccounted: 0, details: logs };
  }

  var liveFormSchema = [];
  try {
    var rawJson = JSON.parse(match[1]);
    liveFormSchema = rawJson[1][1] || [];
  } catch (e) {
    log("❌ PARSE ERROR: Failed to parse Google Form schema: " + e.message);
    return { success: false, totalConfigured: 0, passed: 0, failed: 1, unaccounted: 0, details: logs };
  }

  var liveFieldsMap = {};
  var liveTitlesMap = {};

  liveFormSchema.forEach(function(item) {
    if (item && item[1] && item[4] && item[4][0]) {
      var title = item[1].trim();
      var entryNum = item[4][0][0];
      var entryId = "entry." + entryNum;

      liveFieldsMap[entryId] = title;
      liveTitlesMap[title.toLowerCase()] = { entryId: entryId, realTitle: title };
    }
  });

  var configFields = config.fields || {};
  var passedCount = 0;
  var failedCount = 0;
  var matchedLiveEntryIds = {};

  log("--------------------------------------------------");
  log("VALIDATING FORM_CONFIG FIELDS:");
  log("--------------------------------------------------");

  Object.keys(configFields).forEach(function(fieldKey) {
    var cfgField = configFields[fieldKey];
    var expectedEntryId = cfgField.entryId;
    var expectedTitleMatch = cfgField.titleMatch ? cfgField.titleMatch.trim() : "";

    log("🔍 Checking Key: '" + fieldKey + "' [" + expectedEntryId + "]");

    if (!liveFieldsMap[expectedEntryId]) {
      log("   ❌ INVALID ENTRY ID: '" + expectedEntryId + "' does NOT exist on live form!");
      var matchByTitle = liveTitlesMap[expectedTitleMatch.toLowerCase()];
      if (matchByTitle) {
        log("      💡 SUGGESTION: Title '" + matchByTitle.realTitle + "' found with ID '" + matchByTitle.entryId + "'.");
      }
      failedCount++;
    } else {
      var liveTitle = liveFieldsMap[expectedEntryId];
      matchedLiveEntryIds[expectedEntryId] = true;

      if (expectedTitleMatch && liveTitle.toLowerCase().indexOf(expectedTitleMatch.toLowerCase()) === -1) {
        log("   ⚠️ WARNING: Entry ID matches, but title mismatched.");
        log("      - Expected: '" + expectedTitleMatch + "'");
        log("      - Live Form: '" + liveTitle + "'");
      } else {
        log("   ✔ MATCHED: Verified against Live Form Field -> '" + liveTitle + "'");
      }
      passedCount++;
    }
  });

  log("--------------------------------------------------");
  log("UNACCOUNTED LIVE FORM FIELDS:");
  log("--------------------------------------------------");

  var unaccountedCount = 0;
  Object.keys(liveFieldsMap).forEach(function(entryId) {
    if (!matchedLiveEntryIds[entryId]) {
      log("   ⚠️ UNACCOUNTED: Live Form contains '" + entryId + "' ('" + liveFieldsMap[entryId] + "'), but missing in CONFIG.");
      unaccountedCount++;
    }
  });

  if (unaccountedCount === 0) {
    log("   ✔ All live form fields are fully accounted for in FORM_CONFIG!");
  }

  var isSuccess = failedCount === 0 && unaccountedCount === 0;

  return {
    success: isSuccess,
    totalConfigured: Object.keys(configFields).length,
    passed: passedCount,
    failed: failedCount,
    unaccounted: unaccountedCount,
    details: logs
  };
}