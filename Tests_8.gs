function testGoogleFormSubmitEvent(e) {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — GOOGLE FORM SUBMIT EVENT TEST');
  Logger.log('============================================================');

  if (!e) {
    Logger.log('FAIL: No event object received.');
    Logger.log('This function must be run from a Google Form submit trigger.');
    return;
  }

  Logger.log('Event object received: YES');

  // ------------------------------------------------------------
  // EVENT KEYS
  // ------------------------------------------------------------

  Logger.log('');
  Logger.log('--- EVENT OBJECT ---');

  Logger.log(JSON.stringify(e, null, 2));

  // ------------------------------------------------------------
  // NAMED VALUES
  // ------------------------------------------------------------

  if (e.namedValues) {

    Logger.log('');
    Logger.log('--- e.namedValues ---');
    Logger.log(JSON.stringify(e.namedValues, null, 2));

  } else {

    Logger.log('');
    Logger.log('WARNING: e.namedValues is missing.');

  }

  // ------------------------------------------------------------
  // VALUES
  // ------------------------------------------------------------

  if (e.values) {

    Logger.log('');
    Logger.log('--- e.values ---');
    Logger.log(JSON.stringify(e.values, null, 2));

  } else {

    Logger.log('');
    Logger.log('WARNING: e.values is missing.');

  }

  // ------------------------------------------------------------
  // SOURCE
  // ------------------------------------------------------------

  Logger.log('');
  Logger.log('--- SOURCE ---');

  if (e.source) {
    Logger.log('Source exists: YES');

    try {
      Logger.log('Source type: ' + e.source.getType());
    } catch (err) {
      Logger.log('Could not determine source type.');
    }

  } else {
    Logger.log('Source exists: NO');
  }

  // ------------------------------------------------------------
  // RESULT
  // ------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('GOOGLE FORM SUBMIT EVENT TEST COMPLETE');
  Logger.log('============================================================');
}





/**
 * ============================================================================
 * RD3 TECH — onFormSubmit DIRECT TEST
 * ============================================================================
 *
 * PURPOSE:
 * Tests the actual onFormSubmit(e) function using a simulated Google Forms
 * event object.
 *
 * IMPORTANT:
 * - This DOES call your real onFormSubmit()
 * - This DOES NOT submit to Google Forms
 * - This DOES NOT require a real trigger
 * - It uses the real entry IDs from the current form
 *
 * ============================================================================ */

function testOnFormSubmitDirect() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — onFormSubmit DIRECT TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // SIMULATED GOOGLE FORM SUBMISSION
  // --------------------------------------------------------------------------

  const e = {
    namedValues: {

      'entry.776532163': ['Tom Tom'],
      'entry.1530707551': ['tom.revill@gmail.com'],
      'entry.2118395637': ['021 123 4567'],
      'entry.1366120320': ['Whangarei'],
      'entry.1955012690': ['Email'],
      'entry.1871615748': ['Yes'],
      'entry.480241942': ['Home or Family'],
      'entry.1402987091': ['Help with Something Broken?'],
      'entry.785917515': ['TV'],
      'entry.790093298': ['High']

    },

    values: [
      'Tom Tom',
      'tom.revill@gmail.com',
      '021 123 4567',
      'Whangarei',
      'Email',
      'Yes',
      'Home or Family',
      'Help with Something Broken?',
      'TV',
      'High'
    ],

    range: null,
    source: null
  };

  // --------------------------------------------------------------------------
  // LOG TEST EVENT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- SIMULATED FORM EVENT ---');
  Logger.log(JSON.stringify(e, null, 2));

  // --------------------------------------------------------------------------
  // CALL REAL onFormSubmit
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- CALLING REAL onFormSubmit(e) ---');

  try {

    onFormSubmit(e);

    Logger.log('');
    Logger.log('PASS: onFormSubmit(e) completed without throwing an error.');

  } catch (error) {

    Logger.log('');
    Logger.log('FAIL: onFormSubmit(e) threw an error.');
    Logger.log('Error: ' + error);
    Logger.log('Stack: ' + (error.stack || 'No stack available'));

    throw error;
  }

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('onFormSubmit DIRECT TEST COMPLETE');
  Logger.log('============================================================');
}