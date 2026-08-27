function testTriggerOnFormSubmit() {

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

  onFormSubmit(e);
}





/**
 * ============================================================================
 * RD3 TECH — FIND FORM DATA CONVERSION CODE
 * ============================================================================
 *
 * Searches the Apps Script project files for the code responsible for:
 *
 *   e.response.getItemResponses()
 *   CONVERTED ENTRY DATA
 *   namedValues
 *   entry.xxxxx
 *
 * This does NOT submit a form.
 * This does NOT send emails.
 * This does NOT modify anything.
 * ============================================================================
 */
function findFormDataConversionCode() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('RD3 TECH — SEARCHING PROJECT FOR FORM CONVERSION CODE');
  Logger.log('============================================================');

  const files = DriveApp.getFilesByType(MimeType.GOOGLE_APPS_SCRIPT);

  let found = false;

  while (files.hasNext()) {

    const file = files.next();

    try {

      const projectId = file.getId();

      Logger.log('');
      Logger.log('------------------------------------------------------------');
      Logger.log('SCRIPT FILE FOUND');
      Logger.log('Name: ' + file.getName());
      Logger.log('ID: ' + projectId);
      Logger.log('------------------------------------------------------------');

      // Apps Script projects cannot be read directly through DriveApp.
      // Log the project so we can identify anything relevant.
      if (
        file.getName().toLowerCase().indexOf('mapping') !== -1 ||
        file.getName().toLowerCase().indexOf('code') !== -1 ||
        file.getName().toLowerCase().indexOf('main') !== -1
      ) {
        Logger.log('*** POSSIBLY RELEVANT PROJECT ***');
        found = true;
      }

    } catch (err) {

      Logger.log(
        'ERROR reading project: ' +
        err.message
      );

    }
  }

  Logger.log('');
  Logger.log('============================================================');

  if (found) {
    Logger.log('POSSIBLY RELEVANT PROJECTS FOUND');
  } else {
    Logger.log('NO PROJECTS IDENTIFIED AUTOMATICALLY');
  }

  Logger.log('============================================================');
  Logger.log('');

  Logger.log('IMPORTANT:');
  Logger.log('The next search should be done directly inside the');
  Logger.log('Apps Script editor for these exact strings:');
  Logger.log('');
  Logger.log('1. CONVERTED ENTRY DATA');
  Logger.log('2. getItemResponses');
  Logger.log('3. namedValues');
  Logger.log('4. entry.');
  Logger.log('');
}