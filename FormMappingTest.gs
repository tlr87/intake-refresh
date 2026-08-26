/**
 * ============================================================================
 * RD3 TECH — FORM MAPPING TEST
 * ============================================================================
 *
 * Tests whether the live Google Form can be mapped to RD3 fields WITHOUT
 * using entry.xxxxx IDs.
 *
 * SAFE TEST:
 * - Does NOT modify the Google Form
 * - Does NOT submit a response
 * - Does NOT send emails
 * - Does NOT modify the spreadsheet
 * - Does NOT modify configuration
 * ============================================================================
 */

function testFormMapping() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — FORM MAPPING TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // 1. LOAD CONFIGURATION
  // --------------------------------------------------------------------------

  if (typeof getFormConfig !== 'function') {
    throw new Error('getFormConfig() was not found.');
  }

  const formConfig = getFormConfig();

  if (!formConfig) {
    throw new Error('getFormConfig() returned no configuration.');
  }

  Logger.log('✔ Form configuration loaded.');

  // --------------------------------------------------------------------------
  // 2. GET FORM URL
  // --------------------------------------------------------------------------

  const formUrl =
    formConfig.settings &&
    formConfig.settings.formBaseUrl;

  if (!formUrl) {
    throw new Error(
      'formBaseUrl was not found in form configuration.'
    );
  }

  Logger.log('Form URL: ' + formUrl);

  // --------------------------------------------------------------------------
  // 3. EXTRACT FORM ID
  // --------------------------------------------------------------------------

  const formId = extractFormIdForTest(formUrl);

  Logger.log('✔ Form ID extracted: ' + formId);

  // --------------------------------------------------------------------------
  // 4. OPEN LIVE FORM
  // --------------------------------------------------------------------------

  const form = FormApp.openById(formId);

  Logger.log('✔ Google Form opened successfully.');
  Logger.log('Form title: ' + form.getTitle());

  // --------------------------------------------------------------------------
  // 5. DISCOVER LIVE FORM ITEMS
  // --------------------------------------------------------------------------

  const items = form.getItems();

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('LIVE GOOGLE FORM');
  Logger.log('------------------------------------------------------------');

  items.forEach(function(item, index) {

    Logger.log(
      (index + 1) +
      '. ' +
      item.getTitle() +
      ' | ' +
      item.getType() +
      ' | Google Item ID: ' +
      item.getId()
    );

  });

  // --------------------------------------------------------------------------
  // 6. TEST EACH CONFIGURED FIELD
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('RD3 FIELD MAPPING');
  Logger.log('------------------------------------------------------------');

  const fields = formConfig.fields || {};

  let passed = 0;
  let failed = 0;

  Object.keys(fields).forEach(function(key) {

    const config = fields[key];

    const titleMatch =
      String(config.titleMatch || '')
        .trim()
        .toLowerCase();

    const expectedType =
      normaliseFormTypeForTest(config.type);

    if (!titleMatch) {

      failed++;

      Logger.log(
        '✖ FAIL [' +
        key +
        '] No titleMatch configured.'
      );

      return;
    }

    // Find matching Google Form question.
    const matches = items.filter(function(item) {

      const liveTitle =
        String(item.getTitle() || '')
          .trim()
          .toLowerCase();

      return liveTitle.includes(titleMatch);

    });

    // No match.
    if (matches.length === 0) {

      failed++;

      Logger.log(
        '✖ FAIL [' +
        key +
        '] Question not found.'
      );

      Logger.log(
        '    Looking for: "' +
        titleMatch +
        '"'
      );

      return;
    }

    // Multiple matches.
    if (matches.length > 1) {

      failed++;

      Logger.log(
        '✖ FAIL [' +
        key +
        '] Multiple questions matched.'
      );

      matches.forEach(function(item) {

        Logger.log(
          '    → ' +
          item.getTitle() +
          ' [' +
          item.getType() +
          ']'
        );

      });

      return;
    }

    const item = matches[0];

    // ------------------------------------------------------------------------
    // TYPE CHECK
    // ------------------------------------------------------------------------

    const actualType =
      String(item.getType());

    if (
      expectedType &&
      expectedType !== actualType
    ) {

      failed++;

      Logger.log(
        '✖ FAIL [' +
        key +
        '] Type mismatch.'
      );

      Logger.log(
        '    Question: ' +
        item.getTitle()
      );

      Logger.log(
        '    Expected: ' +
        expectedType
      );

      Logger.log(
        '    Actual: ' +
        actualType
      );

      return;
    }

    // ------------------------------------------------------------------------
    // PASS
    // ------------------------------------------------------------------------

    passed++;

    Logger.log(
      '✔ PASS [' +
      key +
      ']'
    );

    Logger.log(
      '    Question: ' +
      item.getTitle()
    );

    Logger.log(
      '    Type: ' +
      actualType
    );

    Logger.log(
      '    Google Item ID: ' +
      item.getId()
    );

    Logger.log(
      '    entry.xxxxx: NOT USED'
    );

  });

  // --------------------------------------------------------------------------
  // 7. CHECK FOR entryId CONFIGURATION
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('ENTRY ID CHECK');
  Logger.log('------------------------------------------------------------');

  let entryIdsFound = 0;

  Object.keys(fields).forEach(function(key) {

    const config = fields[key];

    if (config.entryId) {

      entryIdsFound++;

      Logger.log(
        '⚠ entryId still exists for [' +
        key +
        ']: ' +
        config.entryId
      );

    }

  });

  if (entryIdsFound === 0) {

    Logger.log(
      '✔ PASS — No entry.xxxxx IDs found in field configuration.'
    );

  } else {

    Logger.log(
      '⚠ WARNING — ' +
      entryIdsFound +
      ' entryId value(s) still exist.'
    );

    Logger.log(
      'The mapping test does NOT use them.'
    );

  }

  // --------------------------------------------------------------------------
  // 8. FINAL RESULT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('TEST RESULT');
  Logger.log('============================================================');

  Logger.log(
    'Configured fields: ' +
    Object.keys(fields).length
  );

  Logger.log(
    'Passed: ' +
    passed
  );

  Logger.log(
    'Failed: ' +
    failed
  );

  Logger.log(
    'entryId values found: ' +
    entryIdsFound
  );

  Logger.log('');

  if (failed === 0) {

    Logger.log(
      '✔ FORM MAPPING TEST PASSED'
    );

    Logger.log('');
    Logger.log(
      'The live Google Form can be mapped using FormApp'
    );

    Logger.log(
      'without relying on entry.xxxxx IDs.'
    );

  } else {

    Logger.log(
      '✖ FORM MAPPING TEST FAILED'
    );

    Logger.log(
      'Review the failures above.'
    );

  }

  Logger.log(
    '============================================================'
  );
}


/**
 * Convert current RD3 config types into Google Form ItemType values.
 */
function normaliseFormTypeForTest(type) {

  if (!type) {
    return '';
  }

  const value =
    String(type)
      .trim()
      .toLowerCase();

  const map = {

    text:
      'TEXT',

    paragraph:
      'PARAGRAPH_TEXT',

    multiple_choice:
      'MULTIPLE_CHOICE',

    checkbox:
      'CHECKBOX',

    list:
      'LIST'

  };

  return map[value] || String(type).toUpperCase();
}


/**
 * Extract Google Form ID from the configured Form URL.
 */
function extractFormIdForTest(url) {

  const match =
    String(url).match(/\/forms\/d\/e\/([^\/]+)/) ||
    String(url).match(/\/forms\/d\/([^\/]+)/);

  if (!match) {

    throw new Error(
      'Could not extract Google Form ID from: ' +
      url
    );

  }

  return match[1];
}