/**
 * ============================================================================
 * RD3 TECH — AUTOMATION ENGINE
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Read the live Google Form and compare it against DRAFT_FIELD_SCHEMA.
 *
 * CURRENT STAGE
 * -------------
 *
 *     GOOGLE FORM
 *          ↓
 *     AUTOMATION
 *          ↓
 *     DRAFT_FIELD_SCHEMA
 *          ↓
 *     COMPARISON / TEST
 *
 * IMPORTANT
 * ---------
 * THIS VERSION DOES NOT WRITE ANYTHING.
 *
 * It does NOT modify:
 *   - FIELD_SCHEMA
 *   - Mapping.gs
 *   - MappingDraft.gs
 *   - ClientEmail
 *   - AdminEmail
 *   - email templates
 *   - Google Form
 *   - Google Sheet
 *
 * ============================================================================
 */


/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

const AUTOMATION_CONFIG = {

  name: 'RD3 TECH — FORM → DRAFT SCHEMA',

  draftSchemaName: 'DRAFT_FIELD_SCHEMA',

  stopOnFirstDifference: false

};


/* ============================================================================
 * PUBLIC ENTRY POINT
 * ========================================================================== */

/**
 * ============================================================================
 * SYNC FORM TO DRAFT SCHEMA — DRY RUN
 * ============================================================================
 *
 * Reads the live Google Form.
 *
 * Reads DRAFT_FIELD_SCHEMA.
 *
 * Compares:
 *   - title
 *   - entryId
 *   - type
 *
 * Nothing is written.
 */
function syncFormToDraftSchema() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — FORM → DRAFT SCHEMA DRY RUN');
  Logger.log('============================================================');

  try {

    /* ------------------------------------------------------------------------
     * READ LIVE FORM
     * ---------------------------------------------------------------------- */

    var formData = readCurrentFormForAutomation_();

    Logger.log(
      'Google Form title: ' + formData.formTitle
    );

    Logger.log(
      'Google Form questions found: ' + formData.fields.length
    );


    /* ------------------------------------------------------------------------
     * READ DRAFT SCHEMA
     * ---------------------------------------------------------------------- */

    var draftSchema = getDraftFieldSchema_();

    Logger.log(
      'DRAFT_FIELD_SCHEMA fields found: ' +
      draftSchema.length
    );


    /* ------------------------------------------------------------------------
     * COMPARE
     * ---------------------------------------------------------------------- */

    var comparison =
      compareFormToDraftSchema_(
        formData.fields,
        draftSchema
      );


    /* ------------------------------------------------------------------------
     * LOG RESULTS
     * ---------------------------------------------------------------------- */

    logSchemaComparison_(comparison);


    /* ------------------------------------------------------------------------
     * DETERMINE PASS
     * ---------------------------------------------------------------------- */

    var passed =
      comparison.added.length === 0 &&
      comparison.removed.length === 0 &&
      comparison.changed.length === 0 &&
      comparison.duplicateKeys.length === 0 &&
      comparison.duplicateTitles.length === 0;

    comparison.passed = passed;


    Logger.log('============================================================');

    if (passed) {

      Logger.log(
        '✅ DRY RUN PASSED — FORM AND DRAFT_FIELD_SCHEMA MATCH'
      );

    } else {

      Logger.log(
        '⚠️ DRY RUN FOUND DIFFERENCES — NO FILES WERE CHANGED'
      );

    }

    Logger.log('============================================================');

    Logger.log('FIELD_SCHEMA: NOT CHANGED');
    Logger.log('EMAIL TEMPLATES: NOT CHANGED');
    Logger.log('MAPPING.GS: NOT CHANGED');
    Logger.log('GOOGLE SHEET: NOT CHANGED');

    Logger.log('============================================================');


    return comparison;


  } catch (error) {

    Logger.log('============================================================');
    Logger.log('❌ AUTOMATION DRY RUN FAILED');
    Logger.log('============================================================');

    Logger.log(
      error && error.message
        ? error.message
        : String(error)
    );

    if (error && error.stack) {
      Logger.log(error.stack);
    }

    Logger.log('============================================================');

    throw error;
  }
}


/* ============================================================================
 * FORM ACCESS
 * ========================================================================== */

/**
 * Opens the configured Google Form.
 *
 * Supports:
 *
 * https://docs.google.com/forms/d/FORM_ID/edit
 *
 * and
 *
 * https://docs.google.com/forms/d/e/FORM_ID/viewform
 */
function getAutomationForm_() {

  var config =
    typeof getFallbackFormConfig === 'function'
      ? getFallbackFormConfig()
      : null;


  if (
    !config ||
    !config.settings ||
    !config.settings.formBaseUrl
  ) {

    throw new Error(
      'Automation could not find settings.formBaseUrl in getFallbackFormConfig().'
    );

  }


  var formUrl =
    String(
      config.settings.formBaseUrl
    ).trim();


  Logger.log(
    'Automation Form URL: ' + formUrl
  );


  if (!formUrl) {

    throw new Error(
      'settings.formBaseUrl is empty.'
    );

  }


  var formId = null;


  /* --------------------------------------------------------------------------
   * /forms/d/e/FORM_ID/
   * ------------------------------------------------------------------------ */

  var match =
    formUrl.match(
      /\/forms\/d\/e\/([a-zA-Z0-9_-]+)/
    );


  if (match && match[1]) {

    formId = match[1];

  }


  /* --------------------------------------------------------------------------
   * /forms/d/FORM_ID/
   * ------------------------------------------------------------------------ */

  if (!formId) {

    match =
      formUrl.match(
        /\/forms\/d\/([a-zA-Z0-9_-]+)/
      );


    if (match && match[1]) {

      formId = match[1];

    }

  }


  /* --------------------------------------------------------------------------
   * SAFETY CHECK
   * ------------------------------------------------------------------------ */

  if (
    !formId ||
    formId === 'e'
  ) {

    throw new Error(
      'Unable to extract a valid Google Form ID from settings.formBaseUrl.\n' +
      'URL: ' + formUrl
    );

  }


  Logger.log(
    'Automation opening Google Form ID: ' +
    formId
  );


  /* --------------------------------------------------------------------------
   * OPEN FORM
   * ------------------------------------------------------------------------ */

  try {

    var form =
      FormApp.openById(formId);


    Logger.log(
      'Automation successfully opened form: ' +
      form.getTitle()
    );


    return form;


  } catch (error) {

    throw new Error(
      'Unable to open Google Form from settings.formBaseUrl.\n' +
      'Form ID: ' +
      formId +
      '\n' +
      'Original error: ' +
      error.message
    );

  }
}


/* ============================================================================
 * READ LIVE FORM
 * ========================================================================== */

/**
 * Reads all actual question fields from the Google Form.
 *
 * Non-question items are ignored.
 */
function readCurrentFormForAutomation_() {

  var form =
    getAutomationForm_();


  var items =
    form.getItems();


  var fields =
    [];


  items.forEach(
    function(item, index) {

      var field =
        convertFormItemToAutomationField_(
          item,
          index
        );


      if (field) {

        fields.push(field);

      }

    }
  );


  return {

    formId:
      form.getId(),

    formTitle:
      form.getTitle(),

    formUrl:
      form.getEditUrl(),

    fields:
      fields

  };

}


/* ============================================================================
 * CONVERT FORM ITEM
 * ========================================================================== */

/**
 * Converts one Google Form item into an automation field.
 */
function convertFormItemToAutomationField_(
  item,
  index
) {

  var itemType =
    item.getType();


  var title = '';


  try {

    title =
      item.getTitle();

  } catch (error) {

    return null;

  }


  if (
    title === null ||
    title === undefined ||
    String(title).trim() === ''
  ) {

    return null;

  }


  var schemaType =
    getAutomationSchemaType_(
      itemType
    );


  if (!schemaType) {

    return null;

  }


  var itemId =
    item.getId();


  var key =
    createCamelCaseKey(
      title
    );


  return {

    index:
      index + 1,

    key:
      key,

    title:
      String(title),

    entryId:
      'entry.' + itemId,

    itemId:
      String(itemId),

    itemType:
      String(itemType),

    type:
      schemaType,

    formField:
      'form_' + key,

    label:
      createDisplayLabel_(
        title
      ),

    aliases:
      createAutomaticAliases_(
        title,
        key
      ),

    section:
      inferAutomationSection_(
        key
      ),

    default:
      getAutomationDefaultValue_(
        key,
        schemaType
      )

  };

}


/* ============================================================================
 * FORM TYPE MAPPING
 * ========================================================================== */

/**
 * Converts Google Form item types into schema types.
 */
function getAutomationSchemaType_(
  itemType
) {

  switch (itemType) {

    case FormApp.ItemType.TEXT:
      return 'text';


    case FormApp.ItemType.PARAGRAPH_TEXT:
      return 'paragraph';


    case FormApp.ItemType.MULTIPLE_CHOICE:
      return 'dropdown';


    case FormApp.ItemType.LIST:
      return 'dropdown';


    case FormApp.ItemType.CHECKBOX:
      return 'list';


    case FormApp.ItemType.CHECKBOX_GRID:
      return 'list';


    case FormApp.ItemType.MULTIPLE_CHOICE_GRID:
      return 'list';


    default:
      return null;

  }

}


/* ============================================================================
 * DRAFT SCHEMA
 * ========================================================================== */

/**
 * Returns DRAFT_FIELD_SCHEMA from MappingDraft.gs.
 */
function getDraftFieldSchema_() {

  if (
    typeof DRAFT_FIELD_SCHEMA === 'undefined'
  ) {

    throw new Error(
      'DRAFT_FIELD_SCHEMA was not found. ' +
      'Make sure MappingDraft.gs exists and defines DRAFT_FIELD_SCHEMA.'
    );

  }


  if (
    !Array.isArray(
      DRAFT_FIELD_SCHEMA
    )
  ) {

    throw new Error(
      'DRAFT_FIELD_SCHEMA must be an array.'
    );

  }


  return DRAFT_FIELD_SCHEMA;

}

function compareFormToDraftSchema_(formFields, draftFields) {

  var result = {
    passed: false,
    formFieldCount: formFields.length,
    draftFieldCount: draftFields.length,
    added: [],
    removed: [],
    changed: [],
    unchanged: [],
    duplicateKeys: [],
    duplicateTitles: [],
    duplicateEntryIds: []
  };

  // --------------------------------------------------------------------------
  // DUPLICATE CHECKS
  // --------------------------------------------------------------------------

  result.duplicateKeys = findDuplicateValues_(
    formFields.map(function(field) {
      return field.key;
    })
  );

  result.duplicateTitles = findDuplicateValues_(
    formFields.map(function(field) {
      return normaliseText_(field.title);
    })
  );

  result.duplicateEntryIds = findDuplicateValues_(
    formFields.map(function(field) {
      return field.entryId;
    })
  );

  // --------------------------------------------------------------------------
  // CREATE ENTRY ID LOOKUPS
  // --------------------------------------------------------------------------

  var formByEntryId = createEntryIdLookup_(formFields);
  var draftByEntryId = createEntryIdLookup_(draftFields);

  // --------------------------------------------------------------------------
  // CHECK LIVE FORM AGAINST DRAFT
  // --------------------------------------------------------------------------

  formFields.forEach(function(formField) {

    var draftField =
      draftByEntryId[formField.entryId];

    // ------------------------------------------------------------------------
    // NEW FIELD
    // ------------------------------------------------------------------------

    if (!draftField) {

      result.added.push({
        key: formField.key,
        title: formField.title,
        entryId: formField.entryId,
        type: formField.type,
        formField: formField.formField
      });

      return;
    }

    // ------------------------------------------------------------------------
    // EXISTING FIELD — COMPARE PROPERTIES
    // ------------------------------------------------------------------------

    var differences =
      compareFieldProperties_(
        formField,
        draftField
      );

    if (differences.length > 0) {

      result.changed.push({
        key: draftField.key,

        title: formField.title,

        entryId: formField.entryId,

        differences: differences,

        form: formField,

        draft: draftField
      });

    } else {

      result.unchanged.push({

        key: draftField.key,

        title: formField.title,

        entryId: formField.entryId

      });

    }

  });

  // --------------------------------------------------------------------------
  // CHECK DRAFT FOR REMOVED FIELDS
  // --------------------------------------------------------------------------

  draftFields.forEach(function(draftField) {

    if (!formByEntryId[draftField.entryId]) {

      result.removed.push({

        key: draftField.key,

        title:
          draftField.title ||
          draftField.label ||
          draftField.key,

        entryId:
          draftField.entryId || '',

        type:
          draftField.type || ''

      });

    }

  });

  return result;
}


/**
 * Creates an entryId → field lookup table.
 *
 * entryId is the authoritative identity of a Google Form question.
 */
function createEntryIdLookup_(fields) {

  var lookup = {};

  fields.forEach(function(field) {

    var entryId =
      String(field.entryId || '').trim();

    if (!entryId) {
      return;
    }

    lookup[entryId] = field;

  });

  return lookup;
}

/* ============================================================================
 * FIELD PROPERTY COMPARISON
 * ========================================================================== */

function compareFieldProperties_(
  formField,
  draftField
) {

  var differences = [];


  compareProperty_(
    differences,
    'title',
    formField.title,
    draftField.title
  );


  compareProperty_(
    differences,
    'entryId',
    formField.entryId,
    draftField.entryId
  );


  compareProperty_(
    differences,
    'type',
    formField.type,
    draftField.type
  );


  return differences;

}


/**
 * Compares two individual properties.
 */
function compareProperty_(
  differences,
  property,
  formValue,
  draftValue
) {

  var a =
    normaliseText_(
      formValue
    );


  var b =
    normaliseText_(
      draftValue
    );


  if (a !== b) {

    differences.push({

      property:
        property,

      formValue:
        formValue,

      draftValue:
        draftValue

    });

  }

}


/* ============================================================================
 * LOOKUP HELPERS
 * ========================================================================== */

function createFieldLookup_(
  fields
) {

  var lookup = {};


  fields.forEach(
    function(field) {

      var key =
        String(
          field.key || ''
        ).trim();


      if (!key) {
        return;
      }


      lookup[key] =
        field;

    }
  );


  return lookup;

}


/**
 * Finds duplicate values.
 */
function findDuplicateValues_(
  values
) {

  var counts = {};
  var duplicates = [];


  values.forEach(
    function(value) {

      if (!value) {
        return;
      }


      counts[value] =
        (
          counts[value] || 0
        ) + 1;

    }
  );


  Object.keys(counts).forEach(
    function(value) {

      if (
        counts[value] > 1
      ) {

        duplicates.push(
          value
        );

      }

    }
  );


  return duplicates;

}


/* ============================================================================
 * KEY GENERATION
 * ========================================================================== */

/**
 * Converts a question title into camelCase.
 *
 * Example:
 *
 * How would you prefer us to contact you?
 *
 * becomes:
 *
 * howWouldYouPreferUsToContactYou
 */
function createCamelCaseKey(
  str
) {

  if (
    str === null ||
    str === undefined
  ) {

    return '';

  }


  return String(str)

    .replace(
      /\s+/g,
      ' '
    )

    .replace(
      /[^a-zA-Z0-9 ]/g,
      ''
    )

    .trim()

    .split(' ')

    .filter(
      function(word) {
        return word.length > 0;
      }
    )

    .map(
      function(word, index) {

        if (
          index === 0
        ) {

          return word.toLowerCase();

        }


        return (
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
        );

      }
    )

    .join('');

}


/* ============================================================================
 * DISPLAY LABEL
 * ========================================================================== */

/**
 * Creates a human-readable application label.
 *
 * IMPORTANT:
 * This function was missing from the previous version.
 *
 * Example:
 *
 * "Address / Location:"
 *
 * becomes:
 *
 * "Address / Location"
 */
function createDisplayLabel_(
  title
) {

  var clean =
    String(
      title || ''
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();


  if (!clean) {
    return '';
  }


  return clean

    .replace(
      /[:?]+$/,
      ''
    )

    .trim();

}


/* ============================================================================
 * ALIASES
 * ========================================================================== */

/**
 * Creates conservative automatic aliases.
 */
function createAutomaticAliases_(
  title,
  key
) {

  var aliases = [];


  if (key) {

    aliases.push(
      key
    );

  }


  var cleanTitle =
    String(
      title || ''
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim()

    .replace(
      /[:?]+$/,
      ''
    )

    .trim();


  if (
    cleanTitle &&
    aliases.indexOf(
      cleanTitle.toLowerCase()
    ) === -1
  ) {

    aliases.push(
      cleanTitle.toLowerCase()
    );

  }


  return aliases;

}


/* ============================================================================
 * SECTION INFERENCE
 * ========================================================================== */

/**
 * Determines the application section.
 */
function inferAutomationSection_(
  key
) {

  var clientFields = [

    'name',
    'email',
    'phone',
    'location',
    'contactPreference',
    'contactingAs',
    'usedBefore'

  ];


  var requestFields = [

    'helpCategory',
    'userGoal',
    'urgency'

  ];


  if (
    clientFields.indexOf(key) !== -1
  ) {

    return 'client';

  }


  if (
    requestFields.indexOf(key) !== -1
  ) {

    return 'request';

  }


  if (
    key === 'honeypot'
  ) {

    return 'security';

  }


  return 'request';

}


/* ============================================================================
 * DEFAULT VALUES
 * ========================================================================== */

function getAutomationDefaultValue_(
  key,
  schemaType
) {

  if (
    key === 'honeypot'
  ) {

    return '';

  }


  if (
    key === 'usedBefore'
  ) {

    return 'No';

  }


  if (
    key === 'urgency'
  ) {

    return 'Medium';

  }


  if (
    key === 'helpCategory'
  ) {

    return 'Not specified';

  }


  if (
    key === 'userGoal'
  ) {

    return 'Not specified';

  }


  if (
    schemaType === 'paragraph'
  ) {

    return 'Not specified';

  }


  return 'Not provided';

}


/* ============================================================================
 * NORMALISATION
 * ========================================================================== */

function normaliseText_(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return '';

  }


  return String(value)

    .replace(
      /\r\n/g,
      '\n'
    )

    .replace(
      /\r/g,
      '\n'
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim()

    .toLowerCase();

}


/* ============================================================================
 * LOGGING
 * ========================================================================== */

function logSchemaComparison_(
  comparison
) {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('FORM → DRAFT SCHEMA COMPARISON');
  Logger.log('============================================================');


  Logger.log(
    'Live Form Fields: ' +
    comparison.formFieldCount
  );


  Logger.log(
    'Draft Fields: ' +
    comparison.draftFieldCount
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * UNCHANGED
   * ------------------------------------------------------------------------ */

  Logger.log(
    'UNCHANGED: ' +
    comparison.unchanged.length
  );


  comparison.unchanged.forEach(
    function(field) {

      Logger.log(
        '  ✅ ' +
        field.key +
        ' — ' +
        field.title +
        ' — ' +
        field.entryId
      );

    }
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * NEW
   * ------------------------------------------------------------------------ */

  Logger.log(
    'NEW FORM FIELDS: ' +
    comparison.added.length
  );


  comparison.added.forEach(
    function(field) {

      Logger.log(
        '  ➕ ' +
        field.key +
        ' — ' +
        field.title +
        ' — ' +
        field.entryId +
        ' — ' +
        field.type
      );

    }
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * CHANGED
   * ------------------------------------------------------------------------ */

  Logger.log(
    'CHANGED FIELDS: ' +
    comparison.changed.length
  );


  comparison.changed.forEach(
    function(field) {

      Logger.log(
        '  ⚠️ ' +
        field.key +
        ' — ' +
        field.title
      );


      field.differences.forEach(
        function(difference) {

          Logger.log(
            '      ' +
            difference.property
          );


          Logger.log(
            '        FORM : ' +
            JSON.stringify(
              difference.formValue
            )
          );


          Logger.log(
            '        DRAFT: ' +
            JSON.stringify(
              difference.draftValue
            )
          );

        }
      );

    }
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * REMOVED
   * ------------------------------------------------------------------------ */

  Logger.log(
    'REMOVED FROM FORM: ' +
    comparison.removed.length
  );


  comparison.removed.forEach(
    function(field) {

      Logger.log(
        '  ➖ ' +
        field.key +
        ' — ' +
        field.title
      );

    }
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * DUPLICATES
   * ------------------------------------------------------------------------ */

  Logger.log(
    'DUPLICATE FORM KEYS: ' +
    comparison.duplicateKeys.length
  );


  comparison.duplicateKeys.forEach(
    function(key) {

      Logger.log(
        '  ❌ ' +
        key
      );

    }
  );


  Logger.log(
    'DUPLICATE FORM TITLES: ' +
    comparison.duplicateTitles.length
  );


  comparison.duplicateTitles.forEach(
    function(title) {

      Logger.log(
        '  ❌ ' +
        title
      );

    }
  );


  Logger.log('');


  /* --------------------------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------------------------ */

  Logger.log(
    '------------------------------------------------------------'
  );

  Logger.log('SUMMARY');

  Logger.log(
    '------------------------------------------------------------'
  );


  Logger.log(
    'Unchanged: ' +
    comparison.unchanged.length
  );


  Logger.log(
    'New: ' +
    comparison.added.length
  );


  Logger.log(
    'Changed: ' +
    comparison.changed.length
  );


  Logger.log(
    'Removed: ' +
    comparison.removed.length
  );


  Logger.log(
    'Duplicate Keys: ' +
    comparison.duplicateKeys.length
  );


  Logger.log(
    'Duplicate Titles: ' +
    comparison.duplicateTitles.length
  );


  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    comparison.added.length === 0 &&
    comparison.removed.length === 0 &&
    comparison.changed.length === 0 &&
    comparison.duplicateKeys.length === 0 &&
    comparison.duplicateTitles.length === 0
  ) {

    Logger.log(
      '✅ FORM AND DRAFT SCHEMA ARE CURRENTLY ALIGNED'
    );

  } else {

    Logger.log(
      '⚠️ FORM AND DRAFT SCHEMA ARE NOT ALIGNED'
    );

    Logger.log(
      'NO PRODUCTION FILES HAVE BEEN CHANGED.'
    );

  }


  Logger.log(
    '============================================================'
  );

}


/* ============================================================================
 * TEST — FULL DRY RUN
 * ========================================================================== */

/**
 * RUN THIS FUNCTION.
 *
 * This is the main test.
 */
function testSyncFormToDraftSchema() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('TEST: syncFormToDraftSchema()');
  Logger.log('============================================================');


  var result =
    syncFormToDraftSchema();


  Logger.log('');
  Logger.log('============================================================');


  if (
    result.passed
  ) {

    Logger.log(
      '✅ TEST PASSED'
    );

  } else {

    Logger.log(
      '⚠️ TEST COMPLETED — DIFFERENCES DETECTED'
    );

  }


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'IMPORTANT: This was a DRY RUN.'
  );


  Logger.log(
    'FIELD_SCHEMA was NOT changed.'
  );


  Logger.log(
    '============================================================'
  );


  return result;

}


/* ============================================================================
 * TEST — FORM ACCESS ONLY
 * ========================================================================== */

/**
 * Tests whether Automation can open the Google Form.
 */
function testReadAutomationForm() {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'TEST: READ GOOGLE FORM'
  );

  Logger.log(
    '============================================================'
  );


  var form =
    getAutomationForm_();


  Logger.log(
    'Form ID: ' +
    form.getId()
  );


  Logger.log(
    'Form Title: ' +
    form.getTitle()
  );


  Logger.log(
    'Form URL: ' +
    form.getEditUrl()
  );


  Logger.log(
    'Item Count: ' +
    form.getItems().length
  );


  Logger.log(
    '============================================================'
  );


  Logger.log(
    '✅ GOOGLE FORM ACCESS TEST PASSED'
  );


  Logger.log(
    '============================================================'
  );


  return true;

}


/* ============================================================================
 * TEST — SHOW LIVE FORM FIELDS
 * ========================================================================== */

function testReadCurrentFormFields() {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'TEST: READ CURRENT GOOGLE FORM FIELDS'
  );

  Logger.log(
    '============================================================'
  );


  var formData =
    readCurrentFormForAutomation_();


  formData.fields.forEach(
    function(field) {

      Logger.log(

        field.index +
        '. ' +
        field.key +
        ' | ' +
        field.title +
        ' | ' +
        field.entryId +
        ' | ' +
        field.type

      );

    }
  );


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Total fields: ' +
    formData.fields.length
  );


  Logger.log(
    '============================================================'
  );


  return formData;

}


/* ============================================================================
 * TEST — SHOW DRAFT
 * ========================================================================== */

function testReadDraftFieldSchema() {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'TEST: READ DRAFT_FIELD_SCHEMA'
  );

  Logger.log(
    '============================================================'
  );


  var draftSchema =
    getDraftFieldSchema_();


  draftSchema.forEach(
    function(field, index) {

      Logger.log(

        (index + 1) +
        '. ' +
        field.key +
        ' | ' +
        field.title +
        ' | ' +
        field.entryId +
        ' | ' +
        field.type

      );

    }
  );


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Total draft fields: ' +
    draftSchema.length
  );


  Logger.log(
    '============================================================'
  );


  return draftSchema;

}


/* ============================================================================
 * REFERENCE GUIDE
 * ========================================================================== */

function generateFormReferenceGuide() {

  var formData =
    readCurrentFormForAutomation_();


  var md = [];


  md.push(
    '# Google Form Field Reference Guide'
  );


  md.push(
    '**Form Title:** ' +
    formData.formTitle
  );


  md.push(
    '**Generated On:** ' +
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() ||
        'Pacific/Auckland',
      'dd MMMM yyyy, h:mm a'
    )
  );


  md.push('');
  md.push('---');
  md.push('');


  md.push(
    '| # | Question Title | Entry ID | Schema Key | Data Type | HTML Template Tag |'
  );


  md.push(
    '|---|---|---|---|---|---|'
  );


  formData.fields.forEach(
    function(field) {

      md.push(

        '| ' +
        field.index +
        ' | ' +
        escapeMarkdown_(
          field.title
        ) +
        ' | `' +
        field.entryId +
        '` | `' +
        field.key +
        '` | `' +
        field.type +
        '` | `<?= request.' +
        field.key +
        ' ?>` |'

      );

    }
  );


  md.push('');
  md.push('---');
  md.push('');


  md.push(
    '### Email Template Usage'
  );


  md.push(
    '- Direct value: `<?= request.keyName ?>`'
  );


  md.push(
    '- Paragraph value: `<span style="white-space: pre-wrap;"><?= request.keyName ?></span>`'
  );


  var output =
    md.join('\n');


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'AUTO-GENERATED FORM REFERENCE GUIDE'
  );


  Logger.log(
    '============================================================'
  );


  Logger.log(
    output
  );


  Logger.log(
    '============================================================'
  );


  return output;

}


/* ============================================================================
 * MARKDOWN ESCAPE
 * ========================================================================== */

function escapeMarkdown_(
  value
) {

  return String(
    value || ''
  )

    .replace(
      /\|/g,
      '\\|'
    )

    .replace(
      /\n/g,
      ' '
    )

    .replace(
      /\r/g,
      ' ' 
    );

}


/* ============================================================================
 * END AUTOMATION ENGINE
 * ============================================================================
 *
 * NEXT STEP
 * ----------
 *
 * Once:
 *
 *     testSyncFormToDraftSchema()
 *
 * correctly identifies the live form and DRAFT_FIELD_SCHEMA,
 * we can build the NEXT controlled operation:
 *
 *     GOOGLE FORM
 *          ↓
 *     AUTOMATION
 *          ↓
 *     DRAFT_FIELD_SCHEMA
 *          ↓
 *     REVIEW
 *          ↓
 *     PROMOTE TO FIELD_SCHEMA
 *
 * Only after that will we move onto:
 *
 *     CLIENT EMAIL
 *     ADMIN EMAIL
 *
 * ============================================================================
 */




/**
 * ============================================================================
 * TEST: RAW GOOGLE FORM DATA
 * ============================================================================
 *
 * READ-ONLY.
 *
 * Shows exactly what Google Forms is returning for each question.
 *
 * Run:
 *     testRawGoogleFormData()
 *
 * Nothing is changed.
 * ============================================================================
 */
function testRawGoogleFormData() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('TEST: RAW GOOGLE FORM DATA');
  Logger.log('============================================================');

  var form = getAutomationForm_();

  Logger.log('Form ID: ' + form.getId());
  Logger.log('Form Title: ' + form.getTitle());
  Logger.log('Form Edit URL: ' + form.getEditUrl());

  var items = form.getItems();

  Logger.log('');
  Logger.log('TOTAL ITEMS: ' + items.length);
  Logger.log('');

  items.forEach(function(item, index) {

    Logger.log('------------------------------------------------------------');
    Logger.log('ITEM #' + (index + 1));
    Logger.log('------------------------------------------------------------');

    Logger.log('Item ID: ' + item.getId());
    Logger.log('Item Type: ' + item.getType());

    var title = '';

    try {
      title = item.getTitle();
    } catch (error) {
      title = '[NO TITLE]';
    }

    Logger.log('Title: ' + JSON.stringify(title));

    /*
     * Generated application-style key.
     * This is ONLY for inspection.
     */
    Logger.log(
      'Generated Key: ' +
      createCamelCaseKey(title)
    );

    /*
     * Entry ID.
     */
    Logger.log(
      'Entry ID: entry.' +
      item.getId()
    );

    /*
     * Try to show choices for dropdown / multiple choice /
     * checkbox questions.
     */
    try {

      if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {

        var choices =
          item.asMultipleChoiceItem().getChoices();

        Logger.log('Choices:');

        choices.forEach(function(choice) {
          Logger.log('  - ' + choice.getValue());
        });

      } else if (item.getType() === FormApp.ItemType.LIST) {

        var listChoices =
          item.asListItem().getChoices();

        Logger.log('Choices:');

        listChoices.forEach(function(choice) {
          Logger.log('  - ' + choice.getValue());
        });

      } else if (item.getType() === FormApp.ItemType.CHECKBOX) {

        var checkboxChoices =
          item.asCheckboxItem().getChoices();

        Logger.log('Choices:');

        checkboxChoices.forEach(function(choice) {
          Logger.log('  - ' + choice.getValue());
        });
      }

    } catch (error) {

      Logger.log(
        'Choices: [unable to read]'
      );

    }

    Logger.log('');
  });

  Logger.log('============================================================');
  Logger.log('RAW GOOGLE FORM TEST COMPLETE');
  Logger.log('============================================================');

  return true;
}









/**
 * ============================================================================
 * TEST: DETECT NEW FORM FIELDS
 * ============================================================================
 *
 * READ-ONLY.
 *
 * Finds Form questions whose entryId does not exist in DRAFT_FIELD_SCHEMA.
 *
 * It suggests a clean application key, but DOES NOT save anything.
 *
 * Run:
 *     testDetectNewFormFields()
 * ============================================================================
 */
function testDetectNewFormFields() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('TEST: DETECT NEW FORM FIELDS');
  Logger.log('============================================================');

  var formData = readCurrentFormForAutomation_();
  var draftSchema = getDraftFieldSchema_();

  var draftByEntryId = createEntryIdLookup_(draftSchema);

  var newFields = [];

  formData.fields.forEach(function(formField) {

    var existing =
      draftByEntryId[formField.entryId];

    if (!existing) {

      newFields.push({
        entryId: formField.entryId,
        title: formField.title,
        generatedKey: formField.key,
        suggestedKey: suggestApplicationKey_(formField),
        type: formField.type,
        itemType: formField.itemType,
        formField: formField.formField
      });

    }

  });

  Logger.log('');

  if (newFields.length === 0) {

    Logger.log('✅ NO NEW FORM FIELDS FOUND');

    Logger.log('');
    Logger.log('All current Form questions already exist');
    Logger.log('in DRAFT_FIELD_SCHEMA by entryId.');

    Logger.log('');
    Logger.log('============================================================');
    Logger.log('NO FILES WERE CHANGED');
    Logger.log('============================================================');

    return newFields;
  }

  Logger.log(
    '⚠️ NEW FORM FIELDS FOUND: ' +
    newFields.length
  );

  Logger.log('');

  newFields.forEach(function(field, index) {

    Logger.log(
      '------------------------------------------------------------'
    );

    Logger.log(
      'NEW FIELD #' + (index + 1)
    );

    Logger.log(
      '------------------------------------------------------------'
    );

    Logger.log(
      'Title: ' +
      field.title
    );

    Logger.log(
      'Entry ID: ' +
      field.entryId
    );

    Logger.log(
      'Google Form Type: ' +
      field.itemType
    );

    Logger.log(
      'Schema Type: ' +
      field.type
    );

    Logger.log(
      'Generated Key: ' +
      field.generatedKey
    );

    Logger.log(
      'Suggested Application Key: ' +
      field.suggestedKey
    );

    Logger.log(
      'Form Field: ' +
      field.formField
    );

    Logger.log(
      'STATUS: ⚠️ REQUIRES REVIEW'
    );

    Logger.log('');
  });

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'NO FILES WERE CHANGED'
  );

  Logger.log(
    '============================================================'
  );

  return newFields;
}


/**
 * ============================================================================
 * SUGGEST APPLICATION KEY
 * ============================================================================
 *
 * Converts a Form question into a SHORTER application-friendly key.
 *
 * IMPORTANT:
 * This is only a suggestion.
 *
 * It does NOT become the official key automatically.
 * ============================================================================
 */
function suggestApplicationKey_(field) {

  var title = String(field.title || '')
    .replace(/\s+/g, ' ')
    .replace(/[?!.:]+$/g, '')
    .trim()
    .toLowerCase();

  Logger.log('DEBUG normalized title: [' + title + ']');

  var knownMappings = {
    'name': 'name',
    'full name': 'name',
    'email': 'email',
    'email address': 'email',
    'phone': 'phone',
    'phone number': 'phone',
    'address / location': 'location',
    'how would you prefer us to contact you': 'contactPreference',
    'have you used rd3 tech before': 'usedBefore',
    'i am contacting rd3 tech as': 'contactingAs',
    'what can we help you with': 'helpCategory',
    'what are you trying to achieve': 'userGoal',
    'how urgent is this for you': 'urgency',
    'what operating system do you use': 'operatingSystem'
  };

  var suggested = knownMappings[title];

  if (suggested) {
    Logger.log(
      'DEBUG known mapping found: ' +
      title +
      ' → ' +
      suggested
    );

    return suggested;
  }

  var generated = createCamelCaseKey(title);

  Logger.log(
    'DEBUG no known mapping. Generated key: ' +
    generated
  );

  if (generated.length <= 40) {
    return generated;
  }

  return '[MANUAL KEY REQUIRED]';
}






