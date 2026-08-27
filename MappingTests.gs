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