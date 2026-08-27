/**
 * ============================================================================
 * RD3 TECH — WEB APP MAPPING / SHEET TESTS
 * ============================================================================
 *
 * Tests:
 *   Website form_* names
 *        ↓
 *   mapFormPayload()
 *        ↓
 *   Internal payload names
 *        ↓
 *   saveToSheet()
 *
 * Does NOT send emails.
 * Does NOT submit a Google Form.
 *
 * Run:
 *   runWebAppMappingTests()
 * ============================================================================
 */

function runWebAppMappingTests() {
  Logger.log('============================================================');
  Logger.log('RD3 TECH — WEB APP MAPPING TESTS');
  Logger.log('============================================================');

  let passed = 0;
  let failed = 0;

  /**
   * Helper to execute and track single assertions
   */
  function check(label, actual, expected) {
    if (assertEqual(label, actual, expected)) {
      passed++;
    } else {
      failed++;
    }
  }

  // ==========================================================================
  // TEST 1 — FULL WEBSITE MAPPING
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 1: FULL WEBSITE MAPPING ---');

  const websiteParams = {
    form_name: 'Tom Web Test',
    form_email: 'tom@example.com',
    form_phone: '021 123 4567',
    form_location: 'Whangarei',
    form_contactPreference: 'Email',
    form_clientType: 'Home or Family',
    form_usedBefore: 'No',
    form_helpCategory: 'Help with Something Broken?',
    form_userGoal: 'Test the complete web app mapping.',
    form_urgency: 'High'
  };

  const mapped = mapFormPayload(websiteParams);
  const payload = mapped.payload;

  check('client.name', payload.client.name, 'Tom Web Test');
  check('client.email', payload.client.email, 'tom@example.com');
  check('client.phone', payload.client.phone, '021 123 4567');
  check('client.location', payload.client.location, 'Whangarei');
  check('client.contactPreference', payload.client.contactPreference, 'Email');
  check('client.contactingAs', payload.client.contactingAs, 'Home or Family');
  
  // payload.client.usedBefore parses as boolean false when form sends "No"
  check('client.usedBefore', payload.client.usedBefore, false);
  
  check('request.helpCategory', payload.request.helpCategory, 'Help with Something Broken?');
  check('request.userGoal', payload.request.userGoal, 'Test the complete web app mapping.');
  check('request.urgency', payload.request.urgency, 'High');

  // ==========================================================================
  // TEST 2 — OLD rd3_ NAMES MUST NOT MAP
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 2: OLD RD3 NAMES IGNORED ---');

  const oldParams = {
    rd3_name: 'OLD NAME',
    rd3_email: 'old@example.com',
    rd3_helpCategory: 'OLD CATEGORY',
    rd3_urgency: 'High'
  };

  const oldPayload = mapFormPayload(oldParams).payload;

  const oldNameOk = oldPayload.client.name === 'Not provided';
  const oldEmailOk = oldPayload.client.email === 'Not provided';
  const oldCatOk = oldPayload.request.helpCategory === '';
  const oldUrgOk = oldPayload.request.urgency === 'Medium';

  if (oldNameOk && oldEmailOk && oldCatOk && oldUrgOk) {
    Logger.log('PASS: OLD RD3 NAMES IGNORED');
    passed++;
  } else {
    Logger.log('FAIL: Old rd3_ parameters were mapped.');
    failed++;
  }

  // ==========================================================================
  // TEST 3 — UNKNOWN FIELDS MUST BE IGNORED
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 3: UNKNOWN FIELDS IGNORED ---');

  const unknownParams = {
    form_name: 'Known Name',
    completely_fake_field: 'Should not appear',
    website: 'Should not appear',
    randomEmail: 'fake@example.com'
  };

  const unknownPayload = mapFormPayload(unknownParams).payload;

  if (
    unknownPayload.client.name === 'Known Name' &&
    !Object.prototype.hasOwnProperty.call(unknownPayload.client, 'completely_fake_field')
  ) {
    Logger.log('PASS: Unknown fields ignored.');
    passed++;
  } else {
    Logger.log('FAIL: Unknown field affected payload.');
    failed++;
  }

  // ==========================================================================
  // TEST 4 — DEFAULT VALUES
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 4: DEFAULT VALUES ---');

  const emptyPayload = mapFormPayload({}).payload;

  const defaultsCorrect =
    emptyPayload.client.name === 'Not provided' &&
    emptyPayload.client.email === 'Not provided' &&
    emptyPayload.client.phone === 'Not provided' &&
    emptyPayload.client.location === 'Not provided' &&
    emptyPayload.client.contactPreference === 'Email' &&
    emptyPayload.client.contactingAs === 'Potential Client' &&
    emptyPayload.client.usedBefore === false &&
    emptyPayload.request.helpCategory === '' &&
    emptyPayload.request.userGoal === '' &&
    emptyPayload.request.urgency === 'Medium';

  if (defaultsCorrect) {
    Logger.log('PASS: DEFAULT VALUES');
    passed++;
  } else {
    Logger.log('FAIL: DEFAULT VALUES');
    Logger.log(JSON.stringify(emptyPayload));
    failed++;
  }

  // ==========================================================================
  // TEST 5 — PREVIOUS CUSTOMER YES
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 5: PREVIOUS CUSTOMER YES ---');

  const yesMapped = mapFormPayload({ form_usedBefore: 'Yes' });

  if (yesMapped.payload.client.usedBefore === true) {
    Logger.log('PASS: usedBefore Yes = true');
    passed++;
  } else {
    Logger.log('FAIL: usedBefore Yes');
    failed++;
  }

  // ==========================================================================
  // TEST 6 — PREVIOUS CUSTOMER NO
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 6: PREVIOUS CUSTOMER NO ---');

  const noMapped = mapFormPayload({ form_usedBefore: 'No' });

  if (noMapped.payload.client.usedBefore === false) {
    Logger.log('PASS: usedBefore No = false');
    passed++;
  } else {
    Logger.log('FAIL: usedBefore No');
    failed++;
  }

  // ==========================================================================
  // TEST 7 — DISPLAY SCHEMA
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 7: DISPLAY SCHEMA ---');

  const display = mapped.displaySchema;

  const displayCorrect =
    display.client.length === 7 &&
    display.request.length === 3 &&
    display.client[0].key === 'name' &&
    display.client[4].key === 'contactPreference' &&
    display.client[5].key === 'contactingAs' &&
    display.client[6].key === 'usedBefore' &&
    display.request[0].key === 'helpCategory' &&
    display.request[1].key === 'userGoal' &&
    display.request[2].key === 'urgency';

  if (displayCorrect) {
    Logger.log('PASS: DISPLAY SCHEMA');
    passed++;
  } else {
    Logger.log('FAIL: DISPLAY SCHEMA');
    Logger.log(JSON.stringify(display));
    failed++;
  }

  // ==========================================================================
  // TEST 8 — SHEET DATA OBJECT
  // ==========================================================================

  Logger.log('');
  Logger.log('--- TEST 8: SHEET DATA MAPPING ---');

  const sheetData = {
    timestamp: payload.submissionDate,
    name: payload.client.name,
    email: payload.client.email,
    phone: payload.client.phone,
    location: payload.client.location,
    contactPreference: payload.client.contactPreference,
    usedBefore: payload.client.usedBefore,
    contactingAs: payload.client.contactingAs,
    helpCategory: payload.request.helpCategory,
    urgency: payload.request.urgency,
    userGoal: payload.request.userGoal
  };

  const sheetDataCorrect =
    sheetData.name === 'Tom Web Test' &&
    sheetData.email === 'tom@example.com' &&
    sheetData.phone === '021 123 4567' &&
    sheetData.location === 'Whangarei' &&
    sheetData.contactPreference === 'Email' &&
    sheetData.usedBefore === false &&
    sheetData.contactingAs === 'Home or Family' &&
    sheetData.helpCategory === 'Help with Something Broken?' &&
    sheetData.urgency === 'High' &&
    sheetData.userGoal === 'Test the complete web app mapping.';

  if (sheetDataCorrect) {
    Logger.log('PASS: SHEET DATA MAPPING');
    passed++;
  } else {
    Logger.log('FAIL: SHEET DATA MAPPING');
    Logger.log(JSON.stringify(sheetData));
    failed++;
  }

  // ==========================================================================
  // RESULTS
  // ==========================================================================

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('WEB APP MAPPING TEST RESULTS');
  Logger.log('============================================================');
  Logger.log('Passed: ' + passed);
  Logger.log('Failed: ' + failed);
  Logger.log('Total: ' + (passed + failed));
  Logger.log('============================================================');

  if (failed === 0) {
    Logger.log('ALL WEB APP MAPPING TESTS PASSED');
  } else {
    Logger.log('SOME WEB APP MAPPING TESTS FAILED');
  }
}

/**
 * ============================================================================
 * SIMPLE ASSERTION HELPER
 * ============================================================================
 */
function assertEqual(label, actual, expected) {
  if (actual === expected) {
    Logger.log('PASS: ' + label + ' = "' + actual + '"');
    return true;
  }

  Logger.log('FAIL: ' + label + ' expected "' + expected + '" but got "' + actual + '"');
  return false;
}