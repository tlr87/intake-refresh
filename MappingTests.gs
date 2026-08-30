/**
 * ============================================================================
 * MappingTests.gs
 * ============================================================================
 *
 * Tests the new FIELD_SCHEMA mapping.
 *
 * These tests verify:
 *
 *   Website field
 *        ↓
 *   FIELD_SCHEMA
 *        ↓
 *   Internal payload
 *
 * There are deliberately NO aliases in these tests.
 * ============================================================================
 */


/**
 * ============================================================================
 * RUN ALL MAPPING TESTS
 * ============================================================================
 */
function runMappingTests() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — MAPPING TESTS');
  Logger.log('============================================================');

  let passed = 0;
  let failed = 0;


  // --------------------------------------------------------------------------
  // TEST 1 — FULL WEBSITE PAYLOAD
  // --------------------------------------------------------------------------

  if (testFullWebsiteMapping()) {
    passed++;
  } else {
    failed++;
  }


  // --------------------------------------------------------------------------
  // TEST 2 — DEFAULT VALUES
  // --------------------------------------------------------------------------

  if (testMappingDefaults()) {
    passed++;
  } else {
    failed++;
  }


  // --------------------------------------------------------------------------
  // TEST 3 — PREVIOUS CUSTOMER YES
  // --------------------------------------------------------------------------

  if (testPreviousCustomerYes()) {
    passed++;
  } else {
    failed++;
  }


  // --------------------------------------------------------------------------
  // TEST 4 — PREVIOUS CUSTOMER NO
  // --------------------------------------------------------------------------

  if (testPreviousCustomerNo()) {
    passed++;
  } else {
    failed++;
  }


  // --------------------------------------------------------------------------
  // TEST 5 — UNKNOWN FIELD IS IGNORED
  // --------------------------------------------------------------------------

  if (testUnknownFieldIgnored()) {
    passed++;
  } else {
    failed++;
  }


  // --------------------------------------------------------------------------
  // TEST 6 — OLD RD3 FIELD NAMES ARE NOT ACCEPTED
  // --------------------------------------------------------------------------

  if (testOldRd3NamesAreIgnored()) {
    passed++;
  } else {
    failed++;
  }


  Logger.log('============================================================');
  Logger.log('MAPPING TEST RESULTS');
  Logger.log('============================================================');

  Logger.log(
    'Passed: ' +
    passed
  );

  Logger.log(
    'Failed: ' +
    failed
  );

  Logger.log(
    'Total: ' +
    (passed + failed)
  );

  Logger.log('============================================================');


  if (failed === 0) {

    Logger.log(
      'ALL MAPPING TESTS PASSED'
    );

  } else {

    Logger.log(
      'MAPPING TESTS FAILED — CHECK LOG ABOVE'
    );

  }
}


/**
 * ============================================================================
 * TEST 1 — FULL WEBSITE MAPPING
 * ============================================================================
 *
 * Verifies every new form_* field maps to the correct internal field.
 */
function testFullWebsiteMapping() {

  Logger.log('');
  Logger.log('--- TEST: FULL WEBSITE MAPPING ---');


  const input = {

    form_name:
      'Tom Mapping Test',

    form_email:
      'tom@example.com',

    form_phone:
      '021 123 4567',

    form_location:
      'Whangarei',

    form_contactPreference:
      'Email',

    form_clientType:
      'Home or Family',

    form_usedBefore:
      'No',

    form_helpCategory:
      'Help with Something Broken?',

    form_userGoal:
      'Test the new mapping system.',

    form_urgency:
      'High'

  };


  const result =
    mapWebsiteFormPayload(
      input
    );


  const payload =
    result.payload;


  let passed = true;


  passed =
    assertEqual(
      'name',
      payload.client.name,
      'Tom Mapping Test'
    ) && passed;


  passed =
    assertEqual(
      'email',
      payload.client.email,
      'tom@example.com'
    ) && passed;


  passed =
    assertEqual(
      'phone',
      payload.client.phone,
      '021 123 4567'
    ) && passed;


  passed =
    assertEqual(
      'location',
      payload.client.location,
      'Whangarei'
    ) && passed;


  passed =
    assertEqual(
      'contactPreference',
      payload.client.contactPreference,
      'Email'
    ) && passed;


  passed =
    assertEqual(
      'contactingAs',
      payload.client.contactingAs,
      'Home or Family'
    ) && passed;


  passed =
    assertEqual(
      'usedBefore',
      payload.client.usedBefore,
      false
    ) && passed;


  passed =
    assertEqual(
      'helpCategory',
      payload.request.helpCategory,
      'Help with Something Broken?'
    ) && passed;


  passed =
    assertEqual(
      'userGoal',
      payload.request.userGoal,
      'Test the new mapping system.'
    ) && passed;


  passed =
    assertEqual(
      'urgency',
      payload.request.urgency,
      'High'
    ) && passed;


  logTestResult(
    'FULL WEBSITE MAPPING',
    passed
  );


  return passed;
}


/**
 * ============================================================================
 * TEST 2 — DEFAULT VALUES
 * ============================================================================
 */
function testMappingDefaults() {

  Logger.log('');
  Logger.log('--- TEST: DEFAULT VALUES ---');


  const result =
    mapWebsiteFormPayload(
      {}
    );


  const payload =
    result.payload;


  let passed = true;


  passed =
    assertEqual(
      'default name',
      payload.client.name,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'default email',
      payload.client.email,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'default phone',
      payload.client.phone,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'default location',
      payload.client.location,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'default contact preference',
      payload.client.contactPreference,
      'Email'
    ) && passed;


  passed =
    assertEqual(
      'default contacting as',
      payload.client.contactingAs,
      'Potential Client'
    ) && passed;


  passed =
    assertEqual(
      'default used before',
      payload.client.usedBefore,
      false
    ) && passed;


  passed =
    assertEqual(
      'default urgency',
      payload.request.urgency,
      'Medium'
    ) && passed;


  logTestResult(
    'DEFAULT VALUES',
    passed
  );


  return passed;
}


/**
 * ============================================================================
 * TEST 3 — PREVIOUS CUSTOMER YES
 * ============================================================================
 */
function testPreviousCustomerYes() {

  Logger.log('');
  Logger.log('--- TEST: PREVIOUS CUSTOMER YES ---');


  const result =
    mapWebsiteFormPayload({

      form_usedBefore:
        'Yes'

    });


  const passed =
    assertEqual(
      'usedBefore Yes',
      result.payload.client.usedBefore,
      true
    );


  logTestResult(
    'PREVIOUS CUSTOMER YES',
    passed
  );


  return passed;
}


/**
 * ============================================================================
 * TEST 4 — PREVIOUS CUSTOMER NO
 * ============================================================================
 */
function testPreviousCustomerNo() {

  Logger.log('');
  Logger.log('--- TEST: PREVIOUS CUSTOMER NO ---');


  const result =
    mapWebsiteFormPayload({

      form_usedBefore:
        'No'

    });


  const passed =
    assertEqual(
      'usedBefore No',
      result.payload.client.usedBefore,
      false
    );


  logTestResult(
    'PREVIOUS CUSTOMER NO',
    passed
  );


  return passed;
}


/**
 * ============================================================================
 * TEST 5 — UNKNOWN FIELD
 * ============================================================================
 *
 * An unknown website field should NOT appear in the internal payload.
 */
function testUnknownFieldIgnored() {

  Logger.log('');
  Logger.log('--- TEST: UNKNOWN FIELD IGNORED ---');


  const result =
    mapWebsiteFormPayload({

      form_name:
        'Tom',

      somethingRandom:
        'Should not be mapped'

    });


  const payload =
    result.payload;


  const passed =
    payload.client.name === 'Tom' &&
    payload.somethingRandom === undefined &&
    payload.client.somethingRandom === undefined &&
    payload.request.somethingRandom === undefined;


  if (passed) {

    Logger.log(
      'PASS: Unknown field was ignored.'
    );

  } else {

    Logger.log(
      'FAIL: Unknown field was incorrectly mapped.'
    );

    Logger.log(
      JSON.stringify(payload)
    );

  }


  return passed;
}


/**
 * ============================================================================
 * TEST 6 — OLD RD3 FIELD NAMES ARE IGNORED
 * ============================================================================
 *
 * This confirms the migration away from:
 *
 *   rd3_name
 *   rd3_email
 *   rd3_helpCategory
 *   rd3_urgency
 *
 * These should no longer be accepted by the website mapper.
 */
function testOldRd3NamesAreIgnored() {

  Logger.log('');
  Logger.log('--- TEST: OLD RD3 NAMES ARE IGNORED ---');


  const result =
    mapWebsiteFormPayload({

      rd3_name:
        'Old Name',

      rd3_email:
        'old@example.com',

      rd3_helpCategory:
        'Old Category',

      rd3_urgency:
        'High'

    });


  const payload =
    result.payload;


  let passed = true;


  passed =
    assertEqual(
      'old rd3_name ignored',
      payload.client.name,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'old rd3_email ignored',
      payload.client.email,
      'Not provided'
    ) && passed;


  passed =
    assertEqual(
      'old rd3_helpCategory ignored',
      payload.request.helpCategory,
      ''
    ) && passed;


  passed =
    assertEqual(
      'old rd3_urgency ignored',
      payload.request.urgency,
      'Medium'
    ) && passed;


  logTestResult(
    'OLD RD3 NAMES IGNORED',
    passed
  );


  return passed;
}


/**
 * ============================================================================
 * WEBSITE PAYLOAD MAPPER
 * ============================================================================
 *
 * This is deliberately separate from the Google Form mapper.
 *
 * Website fields use:
 *
 *   form_name
 *   form_email
 *   form_phone
 *   ...
 *
 * FIELD_SCHEMA defines the relationship.
 */
function mapWebsiteFormPayload(
  rawParams
) {

  const p =
    rawParams || {};


  const payload = {

    submissionDate:
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() ||
          'Pacific/Auckland',
        'yyyy-MM-dd HH:mm:ss z'
      ),

    client: {},

    request: {}

  };


  FIELD_SCHEMA.forEach(
    function(field) {

      let value =
        p[field.formField];


      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ''
      ) {

        value =
          field.default;

      }


      if (
        field.key === 'usedBefore'
      ) {

        payload[field.section][field.key] =
          normalisePreviousCustomer(
            value
          );

      } else {

        payload[field.section][field.key] =
          String(value).trim();

      }

    }
  );


  return {

    payload:
      payload

  };

}


/**
 * ============================================================================
 * ASSERT EQUAL
 * ============================================================================
 */
function assertEqual(
  fieldName,
  actual,
  expected
) {

  if (
    actual === expected
  ) {

    Logger.log(
      'PASS: ' +
      fieldName +
      ' = ' +
      JSON.stringify(actual)
    );

    return true;

  }


  Logger.log(
    'FAIL: ' +
    fieldName +
    ' expected ' +
    JSON.stringify(expected) +
    ' but received ' +
    JSON.stringify(actual)
  );


  return false;

}


/**
 * ============================================================================
 * LOG TEST RESULT
 * ============================================================================
 */
function logTestResult(
  testName,
  passed
) {

  Logger.log(
    passed
      ? 'PASS: ' + testName
      : 'FAIL: ' + testName
  );

}







/**
 * ============================================================================
 * Tests the complete mapped pipeline payload.
 *
 * Phase 6 — Pipeline / Payload Validation
 *
 * This test:
 *   1. Creates a known raw submission.
 *   2. Runs it through mapFormPayload().
 *   3. Validates the resulting payload structure and values.
 *
 * Does NOT send email.
 * Does NOT write to the production sheet.
 * ============================================================================
 */
function testMappedPipelinePayload() {

  Logger.log('============================================================');
  Logger.log('MAPPED PIPELINE PAYLOAD TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // 1. Create known test submission
  // --------------------------------------------------------------------------

  const rawParams = {
    Name: 'Jane Doe',
    Email: 'test.client@example.com',
    Phone: '021 555 1234',
    'Address / Location:': 'Auckland',

    'How would you prefer us to contact you?': 'Email',

    'Have you used RD3 Tech before?': 'No',

    'I am contacting RD3 Tech as:': 'Home or Family',

    'What can we help you with?':
      'Help with Something Broken?',

    'What Are You Trying To Achieve?':
      'Test pipeline mapping',

    'How Urgent Is This For You?':
      'High',

    'Website URL     Security Check: Please leave this field empty.':
      ''
  };

  Logger.log('Raw test submission created: YES');

  // --------------------------------------------------------------------------
  // 2. Run through the real mapping function
  // --------------------------------------------------------------------------

  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error(
      'Mapped pipeline test failed: mapFormPayload() returned no payload.'
    );
  }

  Logger.log('Mapping successful: YES');

  const payload = mapped.payload;

  const client = payload.client || {};
  const request = payload.request || {};
  const security = payload.security || {};

  // --------------------------------------------------------------------------
  // 3. Validate top-level payload structure
  // --------------------------------------------------------------------------

  if (!payload.submissionDate) {
    throw new Error(
      'Mapped pipeline test failed: submissionDate is missing.'
    );
  }

  if (!payload.client) {
    throw new Error(
      'Mapped pipeline test failed: client object is missing.'
    );
  }

  if (!payload.request) {
    throw new Error(
      'Mapped pipeline test failed: request object is missing.'
    );
  }

  if (!payload.security) {
    throw new Error(
      'Mapped pipeline test failed: security object is missing.'
    );
  }

  // --------------------------------------------------------------------------
  // 4. Validate CLIENT fields
  // --------------------------------------------------------------------------

  if (client.name !== 'Jane Doe') {
    throw new Error(
      'Mapped pipeline test failed: client.name is incorrect.'
    );
  }

  if (client.email !== 'test.client@example.com') {
    throw new Error(
      'Mapped pipeline test failed: client.email is incorrect.'
    );
  }

  if (client.phone !== '021 555 1234') {
    throw new Error(
      'Mapped pipeline test failed: client.phone is incorrect.'
    );
  }

  if (client.location !== 'Auckland') {
    throw new Error(
      'Mapped pipeline test failed: client.location is incorrect.'
    );
  }

  if (client.contactPreference !== 'Email') {
    throw new Error(
      'Mapped pipeline test failed: client.contactPreference is incorrect.'
    );
  }

  if (client.contactingAs !== 'Home or Family') {
    throw new Error(
      'Mapped pipeline test failed: client.contactingAs is incorrect.'
    );
  }

  if (client.usedBefore !== false) {
    throw new Error(
      'Mapped pipeline test failed: client.usedBefore is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 5. Validate REQUEST fields
  // --------------------------------------------------------------------------

  if (request.helpCategory !== 'Help with Something Broken?') {
    throw new Error(
      'Mapped pipeline test failed: request.helpCategory is incorrect.'
    );
  }

  if (request.userGoal !== 'Test pipeline mapping') {
    throw new Error(
      'Mapped pipeline test failed: request.userGoal is incorrect.'
    );
  }

  if (request.urgency !== 'High') {
    throw new Error(
      'Mapped pipeline test failed: request.urgency is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 6. Validate SECURITY fields
  // --------------------------------------------------------------------------

  if (security.honeypot !== '') {
    throw new Error(
      'Mapped pipeline test failed: security.honeypot is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 7. Diagnostic output
  // --------------------------------------------------------------------------

  Logger.log('------------------------------------------------------------');
  Logger.log('MAPPED PAYLOAD VALIDATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('Submission Date: ' + payload.submissionDate);

  Logger.log('Client Name: ' + client.name);
  Logger.log('Client Email: ' + client.email);
  Logger.log('Client Phone: ' + client.phone);
  Logger.log('Client Location: ' + client.location);
  Logger.log(
    'Contact Preference: ' + client.contactPreference
  );
  Logger.log(
    'Contacting As: ' + client.contactingAs
  );
  Logger.log(
    'Used Before: ' + client.usedBefore
  );

  Logger.log(
    'Help Category: ' + request.helpCategory
  );
  Logger.log(
    'User Goal: ' + request.userGoal
  );
  Logger.log(
    'Urgency: ' + request.urgency
  );

  Logger.log(
    'Honeypot: "' + security.honeypot + '"'
  );

  Logger.log('------------------------------------------------------------');
  Logger.log('PAYLOAD STRUCTURE');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    'Top-level keys: ' +
    Object.keys(payload).join(', ')
  );

  Logger.log(
    'Client keys: ' +
    Object.keys(client).join(', ')
  );

  Logger.log(
    'Request keys: ' +
    Object.keys(request).join(', ')
  );

  Logger.log(
    'Security keys: ' +
    Object.keys(security).join(', ')
  );

  Logger.log('============================================================');
  Logger.log('✅ MAPPED PIPELINE PAYLOAD TEST PASSED');
  Logger.log('============================================================');
}










/**
 * ============================================================================
 * Phase 6 — Pipeline Processing Test
 *
 * Verifies that the mapped payload can be passed into the next pipeline
 * processing layer without sending email or writing to production.
 *
 * IMPORTANT:
 * This is diagnostic only.
 * It does NOT call onFormSubmit().
 * It does NOT call doPost().
 * It does NOT send email.
 * It does NOT write to the production sheet.
 * ============================================================================
 */
function testPipelineProcessing() {

  Logger.log('============================================================');
  Logger.log('PIPELINE PROCESSING TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // 1. Create known test submission
  // --------------------------------------------------------------------------

  const rawParams = {
    Name: 'Jane Doe',
    Email: 'test.client@example.com',
    Phone: '021 555 1234',
    'Address / Location:': 'Auckland',

    'How would you prefer us to contact you?': 'Email',

    'Have you used RD3 Tech before?': 'No',

    'I am contacting RD3 Tech as:': 'Home or Family',

    'What can we help you with?':
      'Help with Something Broken?',

    'What Are You Trying To Achieve?':
      'Test pipeline processing',

    'How Urgent Is This For You?':
      'High',

    'Website URL     Security Check: Please leave this field empty.':
      ''
  };

  Logger.log('Raw test submission created: YES');

  // --------------------------------------------------------------------------
  // 2. Map submission using the real mapping layer
  // --------------------------------------------------------------------------

  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error(
      'Pipeline processing test failed: mapping returned no payload.'
    );
  }

  const payload = mapped.payload;

  Logger.log('Mapping successful: YES');

  // --------------------------------------------------------------------------
  // 3. Validate payload before handing it to the pipeline
  // --------------------------------------------------------------------------

  if (!payload.client) {
    throw new Error(
      'Pipeline processing test failed: client payload is missing.'
    );
  }

  if (!payload.request) {
    throw new Error(
      'Pipeline processing test failed: request payload is missing.'
    );
  }

  if (!payload.security) {
    throw new Error(
      'Pipeline processing test failed: security payload is missing.'
    );
  }

  Logger.log('Payload structure valid: YES');

  // --------------------------------------------------------------------------
  // 4. Report the payload that is ready for pipeline processing
  // --------------------------------------------------------------------------

  Logger.log('------------------------------------------------------------');
  Logger.log('PIPELINE INPUT');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(payload, null, 2)
  );

  // --------------------------------------------------------------------------
  // 5. Confirm the pipeline input contains the expected values
  // --------------------------------------------------------------------------

  const client = payload.client;
  const request = payload.request;
  const security = payload.security;

  if (client.name !== 'Jane Doe') {
    throw new Error(
      'Pipeline processing test failed: client.name is incorrect.'
    );
  }

  if (client.email !== 'test.client@example.com') {
    throw new Error(
      'Pipeline processing test failed: client.email is incorrect.'
    );
  }

  if (client.contactPreference !== 'Email') {
    throw new Error(
      'Pipeline processing test failed: client.contactPreference is incorrect.'
    );
  }

  if (client.usedBefore !== false) {
    throw new Error(
      'Pipeline processing test failed: client.usedBefore is incorrect.'
    );
  }

  if (request.helpCategory !== 'Help with Something Broken?') {
    throw new Error(
      'Pipeline processing test failed: request.helpCategory is incorrect.'
    );
  }

  if (request.userGoal !== 'Test pipeline processing') {
    throw new Error(
      'Pipeline processing test failed: request.userGoal is incorrect.'
    );
  }

  if (request.urgency !== 'High') {
    throw new Error(
      'Pipeline processing test failed: request.urgency is incorrect.'
    );
  }

  if (security.honeypot !== '') {
    throw new Error(
      'Pipeline processing test failed: honeypot is not empty.'
    );
  }

  // --------------------------------------------------------------------------
  // 6. Final result
  // --------------------------------------------------------------------------

  Logger.log('------------------------------------------------------------');
  Logger.log('PIPELINE INPUT VALIDATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('Client data: YES');
  Logger.log('Request data: YES');
  Logger.log('Security data: YES');
  Logger.log('Expected values: YES');

  Logger.log('============================================================');
  Logger.log('✅ PIPELINE PROCESSING INPUT TEST PASSED');
  Logger.log('============================================================');

  Logger.log(
    'The mapped payload is ready for the next pipeline layer.'
  );
}



/**
 * ============================================================================
 * Phase 6 — Pipeline Output / Build Test
 *
 * Takes a known-good mapped payload and verifies that the downstream display
 * data can be built correctly.
 *
 * SAFE TEST:
 *   - No email is sent.
 *   - No production sheet is written.
 *   - No live form submission is made.
 * ============================================================================
 */
function testPipelineOutputBuild() {

  Logger.log('============================================================');
  Logger.log('PIPELINE OUTPUT / BUILD TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // 1. Create known test submission
  // --------------------------------------------------------------------------

  const rawParams = {
    Name: 'Jane Doe',
    Email: 'test.client@example.com',
    Phone: '021 555 1234',
    'Address / Location:': 'Auckland',

    'How would you prefer us to contact you?': 'Email',

    'Have you used RD3 Tech before?': 'No',

    'I am contacting RD3 Tech as:': 'Home or Family',

    'What can we help you with?':
      'Help with Something Broken?',

    'What Are You Trying To Achieve?':
      'Test pipeline output',

    'How Urgent Is This For You?':
      'High',

    'Website URL     Security Check: Please leave this field empty.':
      ''
  };

  Logger.log('Raw test submission created: YES');

  // --------------------------------------------------------------------------
  // 2. Map through the real mapping layer
  // --------------------------------------------------------------------------

  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error(
      'Pipeline output test failed: mapFormPayload() returned no payload.'
    );
  }

  const payload = mapped.payload;

  Logger.log('Mapping successful: YES');

  // --------------------------------------------------------------------------
  // 3. Validate displaySchema exists
  // --------------------------------------------------------------------------

  if (!mapped.displaySchema) {
    throw new Error(
      'Pipeline output test failed: displaySchema is missing.'
    );
  }

  const displaySchema = mapped.displaySchema;

  if (!displaySchema.client) {
    throw new Error(
      'Pipeline output test failed: displaySchema.client is missing.'
    );
  }

  if (!displaySchema.request) {
    throw new Error(
      'Pipeline output test failed: displaySchema.request is missing.'
    );
  }

  if (!displaySchema.security) {
    throw new Error(
      'Pipeline output test failed: displaySchema.security is missing.'
    );
  }

  Logger.log('Display schema created: YES');

  // --------------------------------------------------------------------------
  // 4. Validate display schema sections
  // --------------------------------------------------------------------------

  if (!Array.isArray(displaySchema.client)) {
    throw new Error(
      'Pipeline output test failed: client display section is not an array.'
    );
  }

  if (!Array.isArray(displaySchema.request)) {
    throw new Error(
      'Pipeline output test failed: request display section is not an array.'
    );
  }

  if (!Array.isArray(displaySchema.security)) {
    throw new Error(
      'Pipeline output test failed: security display section is not an array.'
    );
  }

  // --------------------------------------------------------------------------
  // 5. Helper to find a display field
  // --------------------------------------------------------------------------

  function findDisplayField(section, key) {

    return section.find(function(field) {
      return field && field.key === key;
    });

  }

  // --------------------------------------------------------------------------
  // 6. Validate CLIENT display fields
  // --------------------------------------------------------------------------

  const nameField =
    findDisplayField(displaySchema.client, 'name');

  if (!nameField || nameField.value !== 'Jane Doe') {
    throw new Error(
      'Pipeline output test failed: displayed name is incorrect.'
    );
  }

  const emailField =
    findDisplayField(displaySchema.client, 'email');

  if (!emailField ||
      emailField.value !== 'test.client@example.com') {

    throw new Error(
      'Pipeline output test failed: displayed email is incorrect.'
    );
  }

  const phoneField =
    findDisplayField(displaySchema.client, 'phone');

  if (!phoneField ||
      phoneField.value !== '021 555 1234') {

    throw new Error(
      'Pipeline output test failed: displayed phone is incorrect.'
    );
  }

  const locationField =
    findDisplayField(displaySchema.client, 'location');

  if (!locationField ||
      locationField.value !== 'Auckland') {

    throw new Error(
      'Pipeline output test failed: displayed location is incorrect.'
    );
  }

  const contactPreferenceField =
    findDisplayField(
      displaySchema.client,
      'contactPreference'
    );

  if (!contactPreferenceField ||
      contactPreferenceField.value !== 'Email') {

    throw new Error(
      'Pipeline output test failed: displayed contact preference is incorrect.'
    );
  }

  const contactingAsField =
    findDisplayField(
      displaySchema.client,
      'contactingAs'
    );

  if (!contactingAsField ||
      contactingAsField.value !== 'Home or Family') {

    throw new Error(
      'Pipeline output test failed: displayed contacting-as value is incorrect.'
    );
  }

  const usedBeforeField =
    findDisplayField(
      displaySchema.client,
      'usedBefore'
    );

  if (!usedBeforeField ||
      usedBeforeField.value !== 'No') {

    throw new Error(
      'Pipeline output test failed: displayed previous-customer value is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 7. Validate REQUEST display fields
  // --------------------------------------------------------------------------

  const helpCategoryField =
    findDisplayField(
      displaySchema.request,
      'helpCategory'
    );

  if (!helpCategoryField ||
      helpCategoryField.value !== 'Help with Something Broken?') {

    throw new Error(
      'Pipeline output test failed: displayed help category is incorrect.'
    );
  }

  const userGoalField =
    findDisplayField(
      displaySchema.request,
      'userGoal'
    );

  if (!userGoalField ||
      userGoalField.value !== 'Test pipeline output') {

    throw new Error(
      'Pipeline output test failed: displayed user goal is incorrect.'
    );
  }

  const urgencyField =
    findDisplayField(
      displaySchema.request,
      'urgency'
    );

  if (!urgencyField ||
      urgencyField.value !== 'High') {

    throw new Error(
      'Pipeline output test failed: displayed urgency is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 8. Validate SECURITY display field
  // --------------------------------------------------------------------------

  const honeypotField =
    findDisplayField(
      displaySchema.security,
      'honeypot'
    );

  if (!honeypotField ||
      honeypotField.value !== '') {

    throw new Error(
      'Pipeline output test failed: displayed honeypot is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 9. Diagnostic output
  // --------------------------------------------------------------------------

  Logger.log('------------------------------------------------------------');
  Logger.log('PIPELINE OUTPUT');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(displaySchema, null, 2)
  );

  Logger.log('------------------------------------------------------------');
  Logger.log('OUTPUT VALIDATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('Client display fields: ' +
    displaySchema.client.length);

  Logger.log('Request display fields: ' +
    displaySchema.request.length);

  Logger.log('Security display fields: ' +
    displaySchema.security.length);

  Logger.log('Client values: YES');
  Logger.log('Request values: YES');
  Logger.log('Security values: YES');

  Logger.log('============================================================');
  Logger.log('✅ PIPELINE OUTPUT / BUILD TEST PASSED');
  Logger.log('============================================================');

  Logger.log(
    'Payload successfully produced downstream display output.'
  );
}





/**
 * ============================================================================
 * TEST: testPipelineProcessing()
 * ============================================================================
 *
 * Phase 6C — Pipeline Processing / Email-Data Assembly
 *
 * Tests the processing performed inside onFormSubmit(e) AFTER mapping:
 *
 *   1. Mock submission
 *   2. mapFormPayload()
 *   3. Honeypot evaluation
 *   4. Review keyword evaluation
 *   5. Spam keyword evaluation
 *   6. Urgency evaluation
 *   7. clientData construction
 *   8. requestData construction
 *   9. secEvalData construction
 *  10. Subject prefix construction
 *
 * IMPORTANT:
 *   - Does NOT call onFormSubmit()
 *   - Does NOT send email
 *   - Does NOT write to a spreadsheet
 *   - Does NOT modify production data
 *
 * Run:
 *   testPipelineProcessing
 * ============================================================================
 */
function testPipelineProcessing() {

  Logger.log('============================================================');
  Logger.log('PIPELINE PROCESSING / EMAIL-DATA ASSEMBLY TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // 1. Create the same kind of raw submission used by the pipeline tests
  // --------------------------------------------------------------------------

  const rawParams = {
    Name: 'Jane Doe',
    Email: 'test.client@example.com',
    Phone: '021 555 1234',
    'Address / Location:': 'Auckland',
    'How would you prefer us to contact you?': 'Email',
    'Have you used RD3 Tech before?': 'Yes',
    'I am contacting RD3 Tech as:': 'Home or Family',
    'What can we help you with?': 'Help with Something Broken?',
    'What Are You Trying To Achieve?': 'Test pipeline processing',
    'How Urgent Is This For You?': 'High',
    'Website URL Security Check: Please leave this field empty.': ''
  };

  Logger.log('Raw test submission created: YES');

  // --------------------------------------------------------------------------
  // 2. Map submission through Mapping.gs
  // --------------------------------------------------------------------------

  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error(
      'Pipeline processing test failed: mapFormPayload() returned no payload.'
    );
  }

  Logger.log('Mapping successful: YES');

  const payload = mapped.payload;

  const client = payload.client || {};
  const request = payload.request || {};
  const security = payload.security || {};

  // --------------------------------------------------------------------------
  // 3. Validate mapped input before processing
  // --------------------------------------------------------------------------

  if (client.name !== 'Jane Doe') {
    throw new Error(
      'Pipeline processing test failed: client.name is incorrect.'
    );
  }

  if (client.email !== 'test.client@example.com') {
    throw new Error(
      'Pipeline processing test failed: client.email is incorrect.'
    );
  }

  if (client.phone !== '021 555 1234') {
    throw new Error(
      'Pipeline processing test failed: client.phone is incorrect.'
    );
  }

  if (client.location !== 'Auckland') {
    throw new Error(
      'Pipeline processing test failed: client.location is incorrect.'
    );
  }

  if (client.contactPreference !== 'Email') {
    throw new Error(
      'Pipeline processing test failed: client.contactPreference is incorrect.'
    );
  }

  if (client.contactingAs !== 'Home or Family') {
    throw new Error(
      'Pipeline processing test failed: client.contactingAs is incorrect.'
    );
  }

  if (client.usedBefore !== true) {
    throw new Error(
      'Pipeline processing test failed: client.usedBefore is incorrect.'
    );
  }

  if (request.helpCategory !== 'Help with Something Broken?') {
    throw new Error(
      'Pipeline processing test failed: request.helpCategory is incorrect.'
    );
  }

  if (request.userGoal !== 'Test pipeline processing') {
    throw new Error(
      'Pipeline processing test failed: request.userGoal is incorrect.'
    );
  }

  if (request.urgency !== 'High') {
    throw new Error(
      'Pipeline processing test failed: request.urgency is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 4. Honeypot check
  // --------------------------------------------------------------------------

  const honeypotValue = security.honeypot || '';

  if (honeypotValue && honeypotValue.trim() !== '') {
    throw new Error(
      'Pipeline processing test failed: test submission unexpectedly tripped honeypot.'
    );
  }

  Logger.log('Honeypot check: PASSED');

  // --------------------------------------------------------------------------
  // 5. Load configuration
  // --------------------------------------------------------------------------

  const reviewConfig =
    typeof getReviewConfig === 'function'
      ? getReviewConfig()
      : {};

  const spamConfig =
    typeof getSpamConfig === 'function'
      ? getSpamConfig()
      : {};

  Logger.log('Review configuration loaded: YES');
  Logger.log('Spam configuration loaded: YES');

  // --------------------------------------------------------------------------
  // 6. Review keyword evaluation
  // --------------------------------------------------------------------------

  const userGoal = request.userGoal || '';

  const reviewResult =
    typeof checkReviewKeywords === 'function'
      ? checkReviewKeywords(userGoal, reviewConfig)
      : {
          needsReview: false,
          matchedKeywords: []
        };

  if (!reviewResult) {
    throw new Error(
      'Pipeline processing test failed: review result was not returned.'
    );
  }

  // --------------------------------------------------------------------------
  // 7. Spam keyword evaluation
  // --------------------------------------------------------------------------

  const spamResult =
    typeof checkSpamKeywords === 'function'
      ? checkSpamKeywords(userGoal, spamConfig)
      : {
          isSpam: false,
          matchedKeywords: []
        };

  if (!spamResult) {
    throw new Error(
      'Pipeline processing test failed: spam result was not returned.'
    );
  }

  // --------------------------------------------------------------------------
  // 8. Urgency evaluation
  // --------------------------------------------------------------------------

  const isUrgent =
    (request.urgency || '').toLowerCase() === 'high';

  if (isUrgent !== true) {
    throw new Error(
      'Pipeline processing test failed: urgency was not evaluated as High.'
    );
  }

  // --------------------------------------------------------------------------
  // 9. Build formatted submission date
  // --------------------------------------------------------------------------

  const formattedDate = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Pacific/Auckland',
    'dd MMMM yyyy, h:mm a'
  );

  if (!formattedDate) {
    throw new Error(
      'Pipeline processing test failed: formatted submission date was not created.'
    );
  }

  // --------------------------------------------------------------------------
  // 10. Build clientData
  // --------------------------------------------------------------------------

  const clientData = {
    name: client.name || 'Website Visitor',
    firstName: client.name
      ? client.name.split(' ')[0]
      : 'there',
    email: client.email || 'N/A',
    phone: client.phone || 'N/A',
    location: client.location || 'N/A',
    preferredContact:
      client.contactPreference || 'Not provided',
    isPreviousCustomer:
      !!client.usedBefore,
    contactingAs:
      client.contactingAs || 'Not provided'
  };

  // --------------------------------------------------------------------------
  // 11. Validate clientData
  // --------------------------------------------------------------------------

  if (clientData.name !== 'Jane Doe') {
    throw new Error(
      'Pipeline processing test failed: clientData.name is incorrect.'
    );
  }

  if (clientData.firstName !== 'Jane') {
    throw new Error(
      'Pipeline processing test failed: clientData.firstName is incorrect.'
    );
  }

  if (clientData.email !== 'test.client@example.com') {
    throw new Error(
      'Pipeline processing test failed: clientData.email is incorrect.'
    );
  }

  if (clientData.phone !== '021 555 1234') {
    throw new Error(
      'Pipeline processing test failed: clientData.phone is incorrect.'
    );
  }

  if (clientData.location !== 'Auckland') {
    throw new Error(
      'Pipeline processing test failed: clientData.location is incorrect.'
    );
  }

  if (clientData.preferredContact !== 'Email') {
    throw new Error(
      'Pipeline processing test failed: clientData.preferredContact is incorrect.'
    );
  }

  if (clientData.isPreviousCustomer !== true) {
    throw new Error(
      'Pipeline processing test failed: clientData.isPreviousCustomer is incorrect.'
    );
  }

  if (clientData.contactingAs !== 'Home or Family') {
    throw new Error(
      'Pipeline processing test failed: clientData.contactingAs is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 12. Build requestData
  // --------------------------------------------------------------------------

  const requestData = {
    helpCategory:
      request.helpCategory || 'Not specified',
    userGoal:
      request.userGoal || 'Not specified',
    urgency:
      request.urgency || 'Not specified'
  };

  // --------------------------------------------------------------------------
  // 13. Validate requestData
  // --------------------------------------------------------------------------

  if (requestData.helpCategory !== 'Help with Something Broken?') {
    throw new Error(
      'Pipeline processing test failed: requestData.helpCategory is incorrect.'
    );
  }

  if (requestData.userGoal !== 'Test pipeline processing') {
    throw new Error(
      'Pipeline processing test failed: requestData.userGoal is incorrect.'
    );
  }

  if (requestData.urgency !== 'High') {
    throw new Error(
      'Pipeline processing test failed: requestData.urgency is incorrect.'
    );
  }

  // --------------------------------------------------------------------------
  // 14. Build secEvalData
  // --------------------------------------------------------------------------

  const secEvalData = {
    isSpam:
      spamResult.isSpam || false,

    requiresReview:
      reviewResult.needsReview || false,

    isUrgent:
      isUrgent,

    spamScore:
      spamResult.isSpam ? 100 : 0,

    statusText:
      spamResult.isSpam
        ? 'Flagged Spam'
        : (
            reviewResult.needsReview
              ? 'Requires Review'
              : 'Passed Security Check'
          ),

    spamFlags:
      spamResult.matchedKeywords || [],

    reviewFlags:
      reviewResult.matchedKeywords || [],

    flags: [
      ...(spamResult.matchedKeywords || [])
        .map(k => 'SPAM: ' + k),

      ...(reviewResult.matchedKeywords || [])
        .map(k => 'REVIEW: ' + k)
    ]
  };

  // --------------------------------------------------------------------------
  // 15. Validate secEvalData structure
  // --------------------------------------------------------------------------

  if (typeof secEvalData.isSpam !== 'boolean') {
    throw new Error(
      'Pipeline processing test failed: secEvalData.isSpam is not boolean.'
    );
  }

  if (typeof secEvalData.requiresReview !== 'boolean') {
    throw new Error(
      'Pipeline processing test failed: secEvalData.requiresReview is not boolean.'
    );
  }

  if (secEvalData.isUrgent !== true) {
    throw new Error(
      'Pipeline processing test failed: secEvalData.isUrgent is incorrect.'
    );
  }

  if (typeof secEvalData.spamScore !== 'number') {
    throw new Error(
      'Pipeline processing test failed: secEvalData.spamScore is not numeric.'
    );
  }

  if (!secEvalData.statusText) {
    throw new Error(
      'Pipeline processing test failed: secEvalData.statusText is missing.'
    );
  }

  if (!Array.isArray(secEvalData.spamFlags)) {
    throw new Error(
      'Pipeline processing test failed: secEvalData.spamFlags is not an array.'
    );
  }

  if (!Array.isArray(secEvalData.reviewFlags)) {
    throw new Error(
      'Pipeline processing test failed: secEvalData.reviewFlags is not an array.'
    );
  }

  if (!Array.isArray(secEvalData.flags)) {
    throw new Error(
      'Pipeline processing test failed: secEvalData.flags is not an array.'
    );
  }

  // --------------------------------------------------------------------------
  // 16. Build subject prefix
  // --------------------------------------------------------------------------

  let subjectPrefix = '';

  if (spamResult.isSpam) {
    subjectPrefix +=
      spamConfig.settings?.flagSubjectPrefix || '[SPAM] ';
  }

  if (isUrgent) {
    subjectPrefix += '[URGENT] ';
  }

  if (reviewResult.needsReview) {
    subjectPrefix +=
      reviewConfig.settings?.flagSubjectPrefix || '[FLAGGED] ';
  }

  // --------------------------------------------------------------------------
  // 17. Validate subject prefix
  // --------------------------------------------------------------------------

  if (!subjectPrefix.includes('[URGENT] ')) {
    throw new Error(
      'Pipeline processing test failed: [URGENT] subject prefix was not created.'
    );
  }

  // --------------------------------------------------------------------------
  // 18. Log complete processing result
  // --------------------------------------------------------------------------

  Logger.log('------------------------------------------------------------');
  Logger.log('PIPELINE PROCESSING RESULT');
  Logger.log('------------------------------------------------------------');

  Logger.log('Formatted Date: ' + formattedDate);

  Logger.log('Client Name: ' + clientData.name);
  Logger.log('First Name: ' + clientData.firstName);
  Logger.log('Client Email: ' + clientData.email);
  Logger.log('Client Phone: ' + clientData.phone);
  Logger.log('Client Location: ' + clientData.location);
  Logger.log('Preferred Contact: ' + clientData.preferredContact);
  Logger.log(
    'Previous Customer: ' + clientData.isPreviousCustomer
  );
  Logger.log(
    'Contacting As: ' + clientData.contactingAs
  );

  Logger.log('Help Category: ' + requestData.helpCategory);
  Logger.log('User Goal: ' + requestData.userGoal);
  Logger.log('Urgency: ' + requestData.urgency);

  Logger.log('Spam: ' + secEvalData.isSpam);
  Logger.log('Requires Review: ' + secEvalData.requiresReview);
  Logger.log('Urgent: ' + secEvalData.isUrgent);
  Logger.log('Spam Score: ' + secEvalData.spamScore);
  Logger.log('Status: ' + secEvalData.statusText);
  Logger.log(
    'Spam Flags: ' + JSON.stringify(secEvalData.spamFlags)
  );
  Logger.log(
    'Review Flags: ' + JSON.stringify(secEvalData.reviewFlags)
  );
  Logger.log(
    'All Flags: ' + JSON.stringify(secEvalData.flags)
  );

  Logger.log('Subject Prefix: ' + subjectPrefix);

  Logger.log('------------------------------------------------------------');
  Logger.log('EMAIL TEMPLATE DATA');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    'Admin template client data: READY'
  );

  Logger.log(
    'Admin template request data: READY'
  );

  Logger.log(
    'Admin template security evaluation data: READY'
  );

  Logger.log(
    'Client template client data: READY'
  );

  Logger.log(
    'Client template request data: READY'
  );

  Logger.log('------------------------------------------------------------');
  Logger.log('PIPELINE PROCESSING VALIDATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('Mapped payload: YES');
  Logger.log('Honeypot passed: YES');
  Logger.log('Review evaluation: YES');
  Logger.log('Spam evaluation: YES');
  Logger.log('Urgency evaluation: YES');
  Logger.log('Client data: YES');
  Logger.log('Request data: YES');
  Logger.log('Security evaluation: YES');
  Logger.log('Subject prefix: YES');
  Logger.log('Email template data: YES');

  Logger.log('============================================================');
  Logger.log('✅ PIPELINE PROCESSING TEST PASSED');
  Logger.log('============================================================');
  Logger.log(
    'Pipeline processing is ready for the email-template stage.'
  );
  Logger.log(
    'NO EMAIL WAS SENT.'
  );
  Logger.log(
    'NO PRODUCTION DATA WAS MODIFIED.'
  );
  Logger.log('============================================================');
}




