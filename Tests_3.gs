/**
 * ============================================================================
 * RD3 TECH — WEBSITE PAYLOAD / MAPPING DIAGNOSTIC TEST
 * ============================================================================
 *
 * Purpose:
 *   Verifies that the field names sent by the RD3 website are correctly
 *   mapped by Mapping.gs into the internal RD3 payload structure.
 *
 * This test:
 *   ✓ Simulates the REAL website field names
 *   ✓ Runs mapFormPayload()
 *   ✓ Checks every important field
 *   ✓ Checks the previous-customer boolean conversion
 *   ✓ Checks displaySchema
 *   ✓ DOES NOT send email
 *   ✓ DOES NOT submit to Google Forms
 *   ✓ DOES NOT write to Sheets
 *   ✓ DOES NOT run doPost()
 *
 * Run:
 *   testWebsitePayloadMapping()
 *
 * Expected result:
 *   ALL TESTS PASSED
 * ============================================================================
 */
function testWebsitePayloadMapping() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — WEBSITE PAYLOAD / MAPPING DIAGNOSTIC');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // SIMULATE EXACT WEBSITE FIELD NAMES
  // --------------------------------------------------------------------------

  const websitePayload = {

    rd3_name:
      'Tom Test',

    rd3_email:
      'tom.revill@gmail.com',

    rd3_phone:
      '021 123 4567',

    rd3_contactPreference:
      'Email',

    rd3_usedBefore:
      'No',

    rd3_clientType:
      'Home or Family',

    rd3_location:
      'Whangarei',

    rd3_helpCategory:
      'Help with Something Broken?',

    rd3_userGoal:
      'TEST SUBMISSION ONLY - Please ignore this enquiry. Testing the RD3 Tech contact form, Google Apps Script endpoint, field mapping, validation, email notification and logging.',

    rd3_urgency:
      'Medium',

    website_url:
      ''
  };


  // --------------------------------------------------------------------------
  // DISPLAY RAW PAYLOAD
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- RAW WEBSITE PAYLOAD ---');
  Logger.log(JSON.stringify(websitePayload, null, 2));


  // --------------------------------------------------------------------------
  // CHECK MAPPING FUNCTION EXISTS
  // --------------------------------------------------------------------------

  if (typeof mapFormPayload !== 'function') {

    Logger.log('');
    Logger.log('❌ FATAL: mapFormPayload() does not exist.');
    Logger.log('Check that Mapping.gs is present and saved.');
    Logger.log('============================================================');

    throw new Error(
      'mapFormPayload() is not defined.'
    );
  }


  // --------------------------------------------------------------------------
  // RUN MAPPING
  // --------------------------------------------------------------------------

  let result;

  try {

    result = mapFormPayload(websitePayload);

  } catch (error) {

    Logger.log('');
    Logger.log('❌ MAPPING FUNCTION FAILED');
    Logger.log(error.toString());

    Logger.log('============================================================');

    throw error;
  }


  // --------------------------------------------------------------------------
  // EXTRACT RESULT
  // --------------------------------------------------------------------------

  const payload = result.payload;
  const displaySchema = result.displaySchema;


  Logger.log('');
  Logger.log('--- MAPPED PAYLOAD ---');
  Logger.log(JSON.stringify(payload, null, 2));


  // --------------------------------------------------------------------------
  // TEST COUNTERS
  // --------------------------------------------------------------------------

  let passed = 0;
  let failed = 0;


  // --------------------------------------------------------------------------
  // HELPER
  // --------------------------------------------------------------------------

  function check(testName, actual, expected) {

    if (actual === expected) {

      Logger.log(
        '✓ PASS: ' +
        testName +
        ' = ' +
        JSON.stringify(actual)
      );

      passed++;

    } else {

      Logger.log(
        '❌ FAIL: ' +
        testName +
        ' | Expected: ' +
        JSON.stringify(expected) +
        ' | Actual: ' +
        JSON.stringify(actual)
      );

      failed++;
    }
  }


  // --------------------------------------------------------------------------
  // CLIENT FIELD TESTS
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- CLIENT FIELD TESTS ---');

  check(
    'Name',
    payload.client.name,
    'Tom Test'
  );

  check(
    'Email',
    payload.client.email,
    'tom.revill@gmail.com'
  );

  check(
    'Phone',
    payload.client.phone,
    '021 123 4567'
  );

  check(
    'Preferred Contact',
    payload.client.preferredContact,
    'Email'
  );

  check(
    'Previous Customer',
    payload.client.isPreviousCustomer,
    false
  );

  check(
    'Contacting As',
    payload.client.contactingAs,
    'Home or Family'
  );

  check(
    'Location',
    payload.client.location,
    'Whangarei'
  );


  // --------------------------------------------------------------------------
  // REQUEST FIELD TESTS
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- REQUEST FIELD TESTS ---');

  check(
    'Situation / Help Category',
    payload.request.situation,
    'Help with Something Broken?'
  );

  check(
    'Goal / User Goal',
    payload.request.goal,
    'TEST SUBMISSION ONLY - Please ignore this enquiry. Testing the RD3 Tech contact form, Google Apps Script endpoint, field mapping, validation, email notification and logging.'
  );

  check(
    'Timeframe / Urgency',
    payload.request.timeframe,
    'Medium'
  );


  // --------------------------------------------------------------------------
  // DISPLAY SCHEMA TESTS
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- DISPLAY SCHEMA TESTS ---');

  check(
    'Display schema exists',
    !!displaySchema,
    true
  );

  check(
    'Client display fields count',
    displaySchema.client.length,
    7
  );

  check(
    'Request display fields count',
    displaySchema.request.length,
    3
  );


  // --------------------------------------------------------------------------
  // CHECK DISPLAY VALUES
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- DISPLAY SCHEMA VALUES ---');

  displaySchema.client.forEach(function(field) {

    Logger.log(
      'CLIENT | ' +
      field.key +
      ' | ' +
      field.label +
      ' | ' +
      JSON.stringify(field.value)
    );

  });

  displaySchema.request.forEach(function(field) {

    Logger.log(
      'REQUEST | ' +
      field.key +
      ' | ' +
      field.label +
      ' | ' +
      JSON.stringify(field.value)
    );

  });


  // --------------------------------------------------------------------------
  // BOOLEAN SAFETY CHECK
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- BOOLEAN SAFETY CHECK ---');

  if (payload.client.isPreviousCustomer === false) {

    Logger.log(
      '✓ PASS: "No" correctly converted to boolean false.'
    );

    passed++;

  } else {

    Logger.log(
      '❌ FAIL: "No" was not converted to boolean false.'
    );

    Logger.log(
      'Actual value: ' +
      JSON.stringify(payload.client.isPreviousCustomer)
    );

    failed++;
  }


  // --------------------------------------------------------------------------
  // EMAIL SAFETY CHECK
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- EMAIL VALUE CHECK ---');

  const mappedEmail =
    String(payload.client.email || '').trim().toLowerCase();

  if (
    mappedEmail &&
    mappedEmail.indexOf('@') !== -1
  ) {

    Logger.log(
      '✓ PASS: Valid email available for MailApp.'
    );

    Logger.log(
      'Email: ' + mappedEmail
    );

    passed++;

  } else {

    Logger.log(
      '❌ FAIL: Invalid email after mapping.'
    );

    failed++;
  }


  // --------------------------------------------------------------------------
  // REQUIRED REQUEST DATA CHECK
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- REQUIRED REQUEST DATA CHECK ---');

  check(
    'Situation exists',
    !!payload.request.situation,
    true
  );

  check(
    'Goal exists',
    !!payload.request.goal,
    true
  );

  check(
    'Timeframe exists',
    !!payload.request.timeframe,
    true
  );


  // --------------------------------------------------------------------------
  // FINAL RESULT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('MAPPING TEST RESULT');
  Logger.log('============================================================');

  Logger.log(
    'Tests passed: ' + passed
  );

  Logger.log(
    'Tests failed: ' + failed
  );

  Logger.log('');

  if (failed === 0) {

    Logger.log(
      '✅ ALL MAPPING TESTS PASSED'
    );

    Logger.log('');
    Logger.log(
      'The website field names are mapping correctly.'
    );

    Logger.log(
      'The payload is suitable for the next stage of doPost().'
    );

  } else {

    Logger.log(
      '❌ MAPPING TEST FAILED'
    );

    Logger.log('');
    Logger.log(
      'Do NOT troubleshoot MailApp yet.'
    );

    Logger.log(
      'Fix the field mapping failures first.'
    );
  }

  Logger.log('============================================================');


  // --------------------------------------------------------------------------
  // RETURN RESULT
  // --------------------------------------------------------------------------

  return {
    passed: passed,
    failed: failed,
    success: failed === 0,
    payload: payload,
    displaySchema: displaySchema
  };
}





/**
 * ============================================================================
 * RD3 TECH — FULL doPost EMAIL PIPELINE TEST
 * ============================================================================
 *
 * Simulates the EXACT payload sent by the website and runs it through doPost().
 *
 * This is NOT a direct email/template test.
 *
 * It tests:
 *   Website-style payload
 *   ↓
 *   mapFormPayload()
 *   ↓
 *   Google Form logging
 *   ↓
 *   spam detection
 *   ↓
 *   review detection
 *   ↓
 *   AdminEmail
 *   ↓
 *   ClientEmail
 *
 * ============================================================================
 */
function testWebsiteDoPostPipeline() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — FULL WEBSITE doPost PIPELINE TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // EXACT WEBSITE-STYLE PAYLOAD
  // --------------------------------------------------------------------------

  const testPayload = {
    rd3_name: 'Tom Pipeline Test',
    rd3_email: 'tom.revill@gmail.com',
    rd3_phone: '021 123 4567',
    rd3_contactPreference: 'Email',
    rd3_usedBefore: 'No',
    rd3_clientType: 'Home or Family',
    rd3_location: 'Whangarei',
    rd3_helpCategory: 'Help with Something Broken?',
    rd3_userGoal:
      'PIPELINE TEST ONLY - Please ignore this enquiry. Testing the complete website doPost email pipeline.',
    rd3_urgency: 'Medium',
    website_url: ''
  };

  Logger.log('');
  Logger.log('--- TEST PAYLOAD ---');
  Logger.log(JSON.stringify(testPayload, null, 2));

  // --------------------------------------------------------------------------
  // SIMULATE GOOGLE APPS SCRIPT POST EVENT
  // --------------------------------------------------------------------------

  const fakeEvent = {
    parameter: testPayload,
    parameters: {
      rd3_name: ['Tom Pipeline Test'],
      rd3_email: ['tom.revill@gmail.com'],
      rd3_phone: ['021 123 4567'],
      rd3_contactPreference: ['Email'],
      rd3_usedBefore: ['No'],
      rd3_clientType: ['Home or Family'],
      rd3_location: ['Whangarei'],
      rd3_helpCategory: ['Help with Something Broken?'],
      rd3_userGoal: [
        'PIPELINE TEST ONLY - Please ignore this enquiry. Testing the complete website doPost email pipeline.'
      ],
      rd3_urgency: ['Medium'],
      website_url: ['']
    }
  };

  // --------------------------------------------------------------------------
  // RUN REAL doPost()
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('CALLING REAL doPost()');
  Logger.log('============================================================');

  let result;

  try {

    result = doPost(fakeEvent);

    Logger.log('');
    Logger.log('--- doPost() RETURNED ---');

    if (result) {
      Logger.log(result.getContent());
    } else {
      Logger.log('WARNING: doPost() returned nothing.');
    }

    Logger.log('');
    Logger.log('============================================================');
    Logger.log('doPost() COMPLETED WITHOUT THROWING');
    Logger.log('============================================================');

  } catch (error) {

    Logger.log('');
    Logger.log('============================================================');
    Logger.log('❌ doPost() FAILED');
    Logger.log('============================================================');

    Logger.log('Error: ' + error.toString());
    Logger.log('Message: ' + error.message);
    Logger.log('Stack: ' + error.stack);

    throw error;
  }

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('PIPELINE TEST FINISHED');
  Logger.log('============================================================');

  Logger.log('');
  Logger.log('EXPECTED:');
  Logger.log('  ✓ Website payload accepted');
  Logger.log('  ✓ Mapping completed');
  Logger.log('  ✓ Google Form submission completed');
  Logger.log('  ✓ Spam check completed');
  Logger.log('  ✓ Review check completed');
  Logger.log('  ✓ AdminEmail generated');
  Logger.log('  ✓ Admin email sent');
  Logger.log('  ✓ ClientEmail generated');
  Logger.log('  ✓ Client email sent');

  Logger.log('');
  Logger.log('CHECK YOUR INBOX FOR:');
  Logger.log('  Admin email → tom@rd3tech.com');
  Logger.log('  Client email → tom.revill@gmail.com');

  Logger.log('============================================================');
}