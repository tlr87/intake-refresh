/**
 * ============================================================================
 * RD3 TECH — PRODUCTION AUTOMATION ENGINE
 * ============================================================================
 *
 * FORM → FIELD_SCHEMA SYNCHRONISATION
 *
 * PRODUCTION ARCHITECTURE
 * -----------------------
 *
 * FIELD_SCHEMA
 *     Production field schema stored as JSON in Script Properties.
 *
 * BACKUP_FIELD_SCHEMA
 *     Backup of FIELD_SCHEMA before an approved apply.
 *
 * FIELD_SYNC_PLAN
 *     Current form/schema comparison and approval state.
 *
 *
 * WORKFLOW
 * --------
 *
 *   1. backupForm()
 *   2. checkFormSync()
 *   3. approveFormSync()
 *   4. applyFormSync()
 *   5. verifyFormSync()
 *
 *
 * IMPORTANT
 * ---------
 *
 * FIELD_SCHEMA is NOT stored in this source file.
 *
 * FIELD_SCHEMA exists ONLY in Script Properties.
 *
 * This automation engine:
 *
 *   - reads FIELD_SCHEMA from Script Properties
 *   - compares it with the live Google Form
 *   - creates a sync plan
 *   - requires approval
 *   - backs up FIELD_SCHEMA
 *   - applies approved changes
 *   - verifies the result
 *
 * No source-code schema is maintained.
 *
 * ============================================================================
 */


/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

var AUTOMATION_CONFIG = {

  fieldSchemaPropertyKey:
    'FIELD_SCHEMA',

  backupPropertyKey:
    'BACKUP_FIELD_SCHEMA',

  syncPlanPropertyKey:
    'FIELD_SYNC_PLAN',

  requireApproval:
    true

};


/* ============================================================================
 * PUBLIC FUNCTION #1
 * BACKUP PRODUCTION FIELD_SCHEMA
 * ========================================================================== */

/**
 * Creates a JSON backup of the current production FIELD_SCHEMA.
 *
 * This does NOT modify FIELD_SCHEMA.
 *
 * The backup is stored in:
 *
 *   BACKUP_FIELD_SCHEMA
 */
function backupForm() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — BACKUP PRODUCTION FIELD_SCHEMA'
  );
  Logger.log(
    '============================================================'
  );

  var currentSchema =
    getFieldSchema_();

  var backup =
    JSON.stringify(
      currentSchema
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AUTOMATION_CONFIG.backupPropertyKey,
      backup
    );

  Logger.log(
    '✅ BACKUP CREATED'
  );

  Logger.log(
    'Property: ' +
    AUTOMATION_CONFIG.backupPropertyKey
  );

  Logger.log(
    'Fields backed up: ' +
    currentSchema.length
  );

  Logger.log(
    'JSON size: ' +
    backup.length +
    ' characters'
  );

  Logger.log(
    '============================================================'
  );

  return currentSchema;
}


/* ============================================================================
 * PUBLIC FUNCTION #2
 * CHECK FORM SYNC
 * ========================================================================== */

/**
 * Compares the live Google Form against production FIELD_SCHEMA.
 *
 * Saves the comparison to:
 *
 *   FIELD_SYNC_PLAN
 */
function checkFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — CHECK PRODUCTION FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var formData =
    readCurrentForm_();

  var fieldSchema =
    getFieldSchema_();

  var comparison =
    compareFormToFieldSchema_(
      formData.fields,
      fieldSchema
    );

  comparison.formId =
    formData.formId;

  comparison.formTitle =
    formData.formTitle;

  comparison.formUrl =
    formData.formUrl;

  comparison.checkedAt =
    new Date().toISOString();

  comparison.approved =
    false;

  comparison.applied =
    false;

  saveSyncPlan_(
    comparison
  );

  logSyncPlan_(
    comparison
  );

  Logger.log('');

  if (comparison.passed) {

    Logger.log(
      '✅ PRODUCTION FIELD_SCHEMA IS ALIGNED WITH THE FORM'
    );

  } else {

    Logger.log(
      '⚠️ PRODUCTION FIELD_SCHEMA REQUIRES SYNC'
    );

    Logger.log(
      'Review the plan, then run approveFormSync().'
    );

  }

  Logger.log(
    '============================================================'
  );

  return comparison;
}


/* ============================================================================
 * PUBLIC FUNCTION #3
 * APPROVE FORM SYNC
 * ========================================================================== */

/**
 * Approves the currently saved sync plan.
 *
 * Does NOT modify FIELD_SCHEMA.
 */
function approveFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — APPROVE PRODUCTION FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var plan =
    getSavedSyncPlan_();

  if (!plan) {

    throw new Error(
      'No FIELD_SYNC_PLAN exists. ' +
      'Run checkFormSync() first.'
    );

  }

  if (plan.passed) {

    Logger.log(
      '✅ NO CHANGES REQUIRE APPROVAL'
    );

    return plan;

  }

  plan.approved =
    true;

  plan.approvedAt =
    new Date().toISOString();

  plan.applied =
    false;

  saveSyncPlan_(
    plan
  );

  Logger.log('');

  Logger.log(
    '✅ PRODUCTION FORM SYNC APPROVED'
  );

  Logger.log(
    'You can now run applyFormSync().'
  );

  Logger.log(
    '============================================================'
  );

  return plan;
}


/* ============================================================================
 * PUBLIC FUNCTION #4
 * APPLY FORM SYNC
 * ========================================================================== */

/**
 * Applies the approved sync plan to production FIELD_SCHEMA.
 *
 * Sequence:
 *
 *   1. Load plan
 *   2. Confirm approval
 *   3. Backup FIELD_SCHEMA
 *   4. Verify backup
 *   5. Build updated schema
 *   6. Save FIELD_SCHEMA
 *   7. Read FIELD_SCHEMA back
 *   8. Verify write
 *   9. Mark plan applied
 */
function applyFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — APPLY PRODUCTION FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var plan =
    getSavedSyncPlan_();

  if (!plan) {

    throw new Error(
      'No FIELD_SYNC_PLAN exists. ' +
      'Run checkFormSync() first.'
    );

  }

  if (plan.passed) {

    Logger.log(
      '✅ NO CHANGES REQUIRED'
    );

    return getFieldSchema_();

  }

  if (
    AUTOMATION_CONFIG.requireApproval &&
    plan.approved !== true
  ) {

    throw new Error(
      'PRODUCTION FORM SYNC HAS NOT BEEN APPROVED. ' +
      'Run approveFormSync() first.'
    );

  }

  if (plan.applied === true) {

    throw new Error(
      'This FIELD_SYNC_PLAN has already been applied. ' +
      'Run checkFormSync() again before another apply.'
    );

  }


  /* --------------------------------------------------------------------------
   * STEP 1 — BACKUP PRODUCTION FIELD_SCHEMA
   * ------------------------------------------------------------------------ */

  backupForm();


  /* --------------------------------------------------------------------------
   * STEP 2 — VERIFY BACKUP
   * ------------------------------------------------------------------------ */

  var backup =
    getBackupFieldSchema_();

  var currentSchema =
    getFieldSchema_();

  if (
    JSON.stringify(backup) !==
    JSON.stringify(currentSchema)
  ) {

    throw new Error(
      'Backup verification failed. ' +
      'FIELD_SCHEMA was NOT changed.'
    );

  }

  Logger.log('');

  Logger.log(
    '✅ PRODUCTION FIELD_SCHEMA BACKUP VERIFIED'
  );


  /* --------------------------------------------------------------------------
   * STEP 3 — BUILD UPDATED SCHEMA
   * ------------------------------------------------------------------------ */

  var updatedSchema =
    buildUpdatedFieldSchema_(
      currentSchema,
      plan
    );


  /* --------------------------------------------------------------------------
   * STEP 4 — SAVE PRODUCTION FIELD_SCHEMA
   * ------------------------------------------------------------------------ */

  saveFieldSchema_(
    updatedSchema
  );


  /* --------------------------------------------------------------------------
   * STEP 5 — READ BACK AND VERIFY WRITE
   * ------------------------------------------------------------------------ */

  var savedSchema =
    getFieldSchema_();

  if (
    JSON.stringify(savedSchema) !==
    JSON.stringify(updatedSchema)
  ) {

    throw new Error(
      'FIELD_SCHEMA write verification failed.'
    );

  }


  /* --------------------------------------------------------------------------
   * STEP 6 — MARK PLAN APPLIED
   * ------------------------------------------------------------------------ */

  plan.applied =
    true;

  plan.appliedAt =
    new Date().toISOString();

  saveSyncPlan_(
    plan
  );


  Logger.log('');

  Logger.log(
    '============================================================'
  );

  Logger.log(
    '✅ PRODUCTION FIELD_SCHEMA UPDATED'
  );

  Logger.log(
    'Fields now stored: ' +
    savedSchema.length
  );

  Logger.log(
    'Property: FIELD_SCHEMA'
  );

  Logger.log('');

  Logger.log(
    'Backup property: BACKUP_FIELD_SCHEMA'
  );

  Logger.log(
    'Sync plan property: FIELD_SYNC_PLAN'
  );

  Logger.log(
    'No Apps Script source code was modified.'
  );

  Logger.log(
    '============================================================'
  );

  return savedSchema;
}


/* ============================================================================
 * PUBLIC FUNCTION #5
 * VERIFY FORM SYNC
 * ========================================================================== */

/**
 * Verifies the live Google Form against production FIELD_SCHEMA.
 *
 * Does NOT modify FIELD_SCHEMA.
 */
function verifyFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — VERIFY PRODUCTION FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var formData =
    readCurrentForm_();

  var fieldSchema =
    getFieldSchema_();

  var comparison =
    compareFormToFieldSchema_(
      formData.fields,
      fieldSchema
    );

  logSyncPlan_(
    comparison
  );

  Logger.log('');

  if (comparison.passed) {

    Logger.log(
      '============================================================'
    );

    Logger.log(
      '✅ PRODUCTION VERIFY PASSED'
    );

    Logger.log(
      'FORM AND FIELD_SCHEMA ARE ALIGNED'
    );

    Logger.log(
      '============================================================'
    );

  } else {

    Logger.log(
      '============================================================'
    );

    Logger.log(
      '❌ PRODUCTION VERIFY FAILED'
    );

    Logger.log(
      'FORM AND FIELD_SCHEMA ARE STILL DIFFERENT'
    );

    Logger.log(
      '============================================================'
    );

  }

  return comparison;
}


/* ============================================================================
 * GET PRODUCTION FIELD_SCHEMA
 * ========================================================================== */

/**
 * Reads FIELD_SCHEMA exclusively from Script Properties.
 *
 * There is deliberately NO source-code fallback.
 */
function getFieldSchema_() {

  var stored = PropertiesService
    .getScriptProperties()
    .getProperty('FIELD_SCHEMA');

  if (!stored) {
    throw new Error(
      'FIELD_SCHEMA does not exist in Script Properties.'
    );
  }

  try {

    var parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        'FIELD_SCHEMA JSON must be an object.'
      );
    }

    return parsed;

  } catch (error) {

    throw new Error(
      'Unable to parse FIELD_SCHEMA.\n' +
      error.message
    );

  }
}


/* ============================================================================
 * SAVE PRODUCTION FIELD_SCHEMA
 * ========================================================================== */

function saveFieldSchema_(
  schema
) {

  if (!Array.isArray(schema)) {

    throw new Error(
      'FIELD_SCHEMA must be an array.'
    );

  }

  var json =
    JSON.stringify(
      schema
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AUTOMATION_CONFIG.fieldSchemaPropertyKey,
      json
    );
}


/* ============================================================================
 * GET BACKUP FIELD_SCHEMA
 * ========================================================================== */

function getBackupFieldSchema_() {

  var stored =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AUTOMATION_CONFIG.backupPropertyKey
      );

  if (!stored) {

    throw new Error(
      'BACKUP_FIELD_SCHEMA does not exist.'
    );

  }

  try {

    var parsed =
      JSON.parse(
        stored
      );

    if (!Array.isArray(parsed)) {

      throw new Error(
        'BACKUP_FIELD_SCHEMA JSON must be an array.'
      );

    }

    return parsed;

  } catch (error) {

    throw new Error(
      'Unable to parse BACKUP_FIELD_SCHEMA JSON.\n' +
      error.message
    );

  }
}


/* ============================================================================
 * FORM ACCESS
 * ========================================================================== */

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
      'Automation could not find settings.formBaseUrl.'
    );

  }

  var formUrl =
    String(
      config.settings.formBaseUrl
    ).trim();

  if (!formUrl) {

    throw new Error(
      'settings.formBaseUrl is empty.'
    );

  }

  Logger.log(
    'Automation Form URL: ' +
    formUrl
  );

  var formId =
    extractFormId_(
      formUrl
    );

  Logger.log(
    'Automation opening Google Form ID: ' +
    formId
  );

  try {

    var form =
      FormApp.openById(
        formId
      );

    Logger.log(
      'Automation successfully opened form: ' +
      form.getTitle()
    );

    return form;

  } catch (error) {

    throw new Error(
      'Unable to open Google Form.\n' +
      'Form ID: ' +
      formId +
      '\n' +
      'Original error: ' +
      error.message
    );

  }
}


/* ============================================================================
 * EXTRACT FORM ID
 * ========================================================================== */

function extractFormId_(
  formUrl
) {

  var match =
    formUrl.match(
      /\/forms\/d\/e\/([a-zA-Z0-9_-]+)/
    );

  if (
    match &&
    match[1]
  ) {

    return match[1];

  }

  match =
    formUrl.match(
      /\/forms\/d\/([a-zA-Z0-9_-]+)/
    );

  if (
    match &&
    match[1]
  ) {

    return match[1];

  }

  throw new Error(
    'Unable to extract Google Form ID from:\n' +
    formUrl
  );
}


/* ============================================================================
 * READ CURRENT FORM
 * ========================================================================== */

function readCurrentForm_() {

  var form =
    getAutomationForm_();

  var items =
    form.getItems();

  var fields =
    [];

  items.forEach(
    function(item, index) {

      var field =
        convertFormItemToField_(
          item,
          index
        );

      if (field) {

        fields.push(
          field
        );

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

function convertFormItemToField_(
  item,
  index
) {

  var itemType =
    item.getType();

  var title =
    '';

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
    String(
      item.getId()
    );

  var generatedKey =
    generateApplicationKey_(
      title
    );

  return {

    index:
      index + 1,

    key:
      generatedKey,

    title:
      String(title),

    entryId:
      'entry.' + itemId,

    itemId:
      itemId,

    itemType:
      String(itemType),

    type:
      schemaType,

    formField:
      'form_' + generatedKey,

    label:
      createDisplayLabel_(
        title
      ),

    aliases:
      createAutomaticAliases_(
        title,
        generatedKey
      ),

    section:
      inferAutomationSection_(
        generatedKey
      ),

    default:
      getAutomationDefaultValue_(
        generatedKey,
        schemaType
      )

  };
}


/* ============================================================================
 * FORM TYPE → SCHEMA TYPE
 * ========================================================================== */

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
 * COMPARISON ENGINE
 * ========================================================================== */

function compareFormToFieldSchema_(
  formFields,
  schemaFields
) {

  var result = {

    passed:
      false,

    formFieldCount:
      formFields.length,

    schemaFieldCount:
      schemaFields.length,

    added:
      [],

    removed:
      [],

    changed:
      [],

    unchanged:
      [],

    duplicateKeys:
      [],

    duplicateTitles:
      [],

    duplicateEntryIds:
      []

  };


  /* --------------------------------------------------------------------------
   * DUPLICATES
   * ------------------------------------------------------------------------ */

  result.duplicateKeys =
    findDuplicateValues_(
      formFields.map(
        function(field) {

          return normaliseText_(
            field.key
          );

        }
      )
    );

  result.duplicateTitles =
    findDuplicateValues_(
      formFields.map(
        function(field) {

          return normaliseText_(
            field.title
          );

        }
      )
    );

  result.duplicateEntryIds =
    findDuplicateValues_(
      formFields.map(
        function(field) {

          return field.entryId;

        }
      )
    );


  /* --------------------------------------------------------------------------
   * LOOKUPS
   * ------------------------------------------------------------------------ */

  var formByEntryId =
    createEntryIdLookup_(
      formFields
    );

  var schemaByEntryId =
    createEntryIdLookup_(
      schemaFields
    );


  /* --------------------------------------------------------------------------
   * FORM → FIELD_SCHEMA
   * ------------------------------------------------------------------------ */

  formFields.forEach(
    function(formField) {

      var schemaField =
        schemaByEntryId[
          formField.entryId
        ];


      /* ----------------------------------------------------------------------
       * NEW FORM QUESTION
       * -------------------------------------------------------------------- */

      if (!schemaField) {

        result.added.push({

          form:
            formField,

          suggestedKey:
            suggestApplicationKey_(
              formField,
              schemaFields
            )

        });

        return;

      }


      /* ----------------------------------------------------------------------
       * EXISTING QUESTION
       * -------------------------------------------------------------------- */

      var differences =
        compareFieldProperties_(
          formField,
          schemaField
        );

      if (
        differences.length > 0
      ) {

        result.changed.push({

          key:
            schemaField.key,

          entryId:
            schemaField.entryId,

          differences:
            differences,

          form:
            formField,

          schema:
            schemaField

        });

      } else {

        result.unchanged.push({

          key:
            schemaField.key,

          title:
            formField.title,

          entryId:
            formField.entryId

        });

      }

    }
  );


  /* --------------------------------------------------------------------------
   * FIELD_SCHEMA → FORM
   *
   * Anything in FIELD_SCHEMA that no longer exists in the Form is removed.
   * ------------------------------------------------------------------------ */

  schemaFields.forEach(
    function(schemaField) {

      if (
        !formByEntryId[
          schemaField.entryId
        ]
      ) {

        result.removed.push({

          key:
            schemaField.key,

          title:
            schemaField.title ||
            schemaField.label ||
            schemaField.key,

          entryId:
            schemaField.entryId || '',

          type:
            schemaField.type || ''

        });

      }

    }
  );


  /* --------------------------------------------------------------------------
   * FINAL RESULT
   * ------------------------------------------------------------------------ */

  result.passed =

    result.added.length === 0 &&

    result.removed.length === 0 &&

    result.changed.length === 0 &&

    result.duplicateKeys.length === 0 &&

    result.duplicateTitles.length === 0 &&

    result.duplicateEntryIds.length === 0;


  return result;
}


/* ============================================================================
 * BUILD UPDATED PRODUCTION FIELD_SCHEMA
 * ========================================================================== */

function buildUpdatedFieldSchema_(
  currentSchema,
  plan
) {

  var updated =
    JSON.parse(
      JSON.stringify(
        currentSchema
      )
    );


  /* --------------------------------------------------------------------------
   * ADDITIONS
   * ------------------------------------------------------------------------ */

  plan.added.forEach(
    function(change) {

      var field =
        change.form;

      var newKey =
        makeUniqueSchemaKey_(
          change.suggestedKey,
          updated
        );

      var newField = {

        key:
          newKey,

        formField:
          'form_' + newKey,

        title:
          field.title,

        entryId:
          field.entryId,

        type:
          field.type,

        aliases:
          createAutomaticAliases_(
            field.title,
            newKey
          ),

        label:
          createDisplayLabel_(
            field.title
          ),

        section:
          inferAutomationSection_(
            newKey
          ),

        default:
          getAutomationDefaultValue_(
            newKey,
            field.type
          )

      };

      updated.push(
        newField
      );

      Logger.log(
        '➕ ADDING PRODUCTION FIELD: ' +
        newKey +
        ' — ' +
        field.title
      );

    }
  );


  /* --------------------------------------------------------------------------
   * EXISTING CHANGES
   * ------------------------------------------------------------------------ */

  plan.changed.forEach(
    function(change) {

      var index =
        findSchemaIndexByEntryId_(
          updated,
          change.entryId
        );

      if (
        index === -1
      ) {

        return;

      }

      var existing =
        updated[index];

      var formField =
        change.form;


      /*
       * APPLICATION IDENTITY IS PRESERVED.
       *
       * The existing key remains unchanged.
       */

      existing.title =
        formField.title;

      existing.entryId =
        formField.entryId;

      existing.type =
        formField.type;


      /*
       * Existing formField is intentionally preserved.
       */

      existing.label =
        createDisplayLabel_(
          formField.title
        );


      existing.aliases =
        mergeAliases_(
          existing.aliases,
          [
            formField.title
          ]
        );


      delete existing.inactive;

      delete existing.removedFromForm;


      Logger.log(
        '✏️ UPDATING PRODUCTION FIELD: ' +
        existing.key +
        ' — ' +
        formField.title
      );

    }
  );


  /* --------------------------------------------------------------------------
   * REMOVALS
   * ------------------------------------------------------------------------ */

  var removalIndexes =
    [];

  plan.removed.forEach(
    function(change) {

      var index =
        findSchemaIndexByEntryId_(
          updated,
          change.entryId
        );

      if (
        index !== -1
      ) {

        removalIndexes.push(
          index
        );

      }

    }
  );


  /*
   * Highest index first.
   */

  removalIndexes.sort(
    function(a, b) {

      return b - a;

    }
  );


  removalIndexes.forEach(
    function(index) {

      var removedField =
        updated[index];

      Logger.log(
        '➖ REMOVING PRODUCTION FIELD: ' +
        removedField.key +
        ' — ' +
        removedField.title
      );

      updated.splice(
        index,
        1
      );

    }
  );


  return updated;
}


/* ============================================================================
 * ENTRY ID LOOKUP
 * ========================================================================== */

function createEntryIdLookup_(
  fields
) {

  var lookup =
    {};

  fields.forEach(
    function(field) {

      var entryId =
        String(
          field.entryId || ''
        ).trim();

      if (!entryId) {

        return;

      }

      lookup[entryId] =
        field;

    }
  );

  return lookup;
}


/* ============================================================================
 * FIND FIELD BY ENTRY ID
 * ========================================================================== */

function findSchemaIndexByEntryId_(
  schema,
  entryId
) {

  var target =
    String(
      entryId || ''
    ).trim();

  for (
    var i = 0;
    i < schema.length;
    i++
  ) {

    if (
      String(
        schema[i].entryId || ''
      ).trim() === target
    ) {

      return i;

    }

  }

  return -1;
}


/* ============================================================================
 * FIELD COMPARISON
 * ========================================================================== */

function compareFieldProperties_(
  formField,
  schemaField
) {

  var differences =
    [];

  compareProperty_(
    differences,
    'title',
    formField.title,
    schemaField.title
  );

  compareProperty_(
    differences,
    'type',
    formField.type,
    schemaField.type
  );

  return differences;
}


function compareProperty_(
  differences,
  property,
  formValue,
  schemaValue
) {

  var a =
    normaliseText_(
      formValue
    );

  var b =
    normaliseText_(
      schemaValue
    );

  if (
    a !== b
  ) {

    differences.push({

      property:
        property,

      formValue:
        formValue,

      schemaValue:
        schemaValue

    });

  }
}


/* ============================================================================
 * APPLICATION KEY GENERATION
 * ========================================================================== */

function suggestApplicationKey_(
  field,
  schema
) {

  var title =
    String(
      field.title || ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .replace(
        /[?!.:]+$/g,
        ''
      )
      .trim();

  var generated =
    generateApplicationKey_(
      title
    );

  if (!generated) {

    generated =
      'field';

  }

  return makeUniqueSchemaKey_(
    generated,
    schema
  );
}


/* ============================================================================
 * GENERATE APPLICATION KEY
 * ========================================================================== */

function generateApplicationKey_(
  str
) {

  if (
    str === null ||
    str === undefined
  ) {

    return '';

  }

  var value =
    String(
      str
    )
      .replace(
        /\s+/g,
        ' '
      )
      .replace(
        /[^a-zA-Z0-9 ]/g,
        ''
      )
      .trim();

  if (!value) {

    return '';

  }

  var words =
    value
      .split(' ')
      .filter(
        function(word) {

          return word.length > 0;

        }
      );

  var result =
    '';

  words.forEach(
    function(word, index) {

      if (
        index === 0
      ) {

        result +=
          word.toLowerCase();

      } else {

        result +=
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase();

      }

    }
  );

  return result;
}


/* ============================================================================
 * UNIQUE APPLICATION KEY
 * ========================================================================== */

function makeUniqueSchemaKey_(
  proposedKey,
  schema
) {

  var base =
    proposedKey ||
    'field';

  var candidate =
    base;

  var number =
    2;

  while (
    schema.some(
      function(field) {

        return (
          String(
            field.key || ''
          ).toLowerCase() ===
          candidate.toLowerCase()
        );

      }
    )
  ) {

    candidate =
      base +
      number;

    number++;

  }

  return candidate;
}


/* ============================================================================
 * LABEL
 * ========================================================================== */

function createDisplayLabel_(
  title
) {

  return String(
    title || ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .replace(
      /[:?]+$/g,
      ''
    )
    .trim();
}


/* ============================================================================
 * ALIASES
 * ========================================================================== */

function createAutomaticAliases_(
  title,
  key
) {

  var aliases =
    [];

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
        /[:?]+$/g,
        ''
      )
      .trim()
      .toLowerCase();

  if (
    cleanTitle &&
    aliases.indexOf(
      cleanTitle
    ) === -1
  ) {

    aliases.push(
      cleanTitle
    );

  }

  return aliases;
}


/* ============================================================================
 * MERGE ALIASES
 * ========================================================================== */

function mergeAliases_(
  existing,
  additions
) {

  var result =
    Array.isArray(existing)
      ? existing.slice()
      : [];

  (additions || []).forEach(
    function(alias) {

      var value =
        String(
          alias || ''
        )
          .replace(
            /\s+/g,
            ' '
          )
          .trim();

      if (!value) {

        return;

      }

      var exists =
        result.some(
          function(existingAlias) {

            return (
              String(
                existingAlias || ''
              ).toLowerCase() ===
              value.toLowerCase()
            );

          }
        );

      if (!exists) {

        result.push(
          value
        );

      }

    }
  );

  return result;
}


/* ============================================================================
 * SECTION
 * ========================================================================== */

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
    'urgency',
    'operatingSystem',
    'whatOperatingSystemDoYouUse'

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

  return String(
    value
  )
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
 * DUPLICATES
 * ========================================================================== */

function findDuplicateValues_(
  values
) {

  var counts =
    {};

  var duplicates =
    [];

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

  Object.keys(
    counts
  ).forEach(
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
 * SYNC PLAN STORAGE
 * ========================================================================== */

function saveSyncPlan_(
  plan
) {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AUTOMATION_CONFIG.syncPlanPropertyKey,
      JSON.stringify(
        plan
      )
    );
}


function getSavedSyncPlan_() {

  var stored =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AUTOMATION_CONFIG.syncPlanPropertyKey
      );

  if (!stored) {

    return null;

  }

  try {

    var plan =
      JSON.parse(
        stored
      );

    if (
      !plan ||
      typeof plan !== 'object'
    ) {

      throw new Error(
        'FIELD_SYNC_PLAN must be a JSON object.'
      );

    }

    return plan;

  } catch (error) {

    throw new Error(
      'Saved FIELD_SYNC_PLAN is invalid.\n' +
      error.message
    );

  }
}


/* ============================================================================
 * LOG SYNC PLAN
 * ========================================================================== */

function logSyncPlan_(
  comparison
) {

  Logger.log('');
  Logger.log(
    '============================================================'
  );

  Logger.log(
    'FORM → PRODUCTION FIELD_SCHEMA COMPARISON'
  );

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'Live Form Fields: ' +
    comparison.formFieldCount
  );

  Logger.log(
    'Production Schema Fields: ' +
    comparison.schemaFieldCount
  );

  Logger.log('');

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

  Logger.log(
    'NEW FORM FIELDS: ' +
    comparison.added.length
  );

  comparison.added.forEach(
    function(change) {

      Logger.log(
        '  ➕ ' +
        change.suggestedKey +
        ' — ' +
        change.form.title +
        ' — ' +
        change.form.entryId
      );

    }
  );

  Logger.log('');

  Logger.log(
    'CHANGED FIELDS: ' +
    comparison.changed.length
  );

  comparison.changed.forEach(
    function(change) {

      Logger.log(
        '  ✏️ ' +
        change.key +
        ' — ' +
        change.entryId
      );

      change.differences.forEach(
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
            '        SCHEMA: ' +
            JSON.stringify(
              difference.schemaValue
            )
          );

        }
      );

    }
  );

  Logger.log('');

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
        field.title +
        ' — ' +
        field.entryId
      );

    }
  );

  Logger.log('');

  Logger.log(
    'DUPLICATE FORM KEYS: ' +
    comparison.duplicateKeys.length
  );

  Logger.log(
    'DUPLICATE FORM TITLES: ' +
    comparison.duplicateTitles.length
  );

  Logger.log(
    'DUPLICATE ENTRY IDs: ' +
    comparison.duplicateEntryIds.length
  );

  Logger.log('');

  Logger.log(
    '------------------------------------------------------------'
  );

  if (
    comparison.passed
  ) {

    Logger.log(
      '✅ FORM AND PRODUCTION FIELD_SCHEMA ARE ALIGNED'
    );

  } else {

    Logger.log(
      '⚠️ PRODUCTION SYNC REQUIRED'
    );

  }

  Logger.log(
    '------------------------------------------------------------'
  );
}


/* ============================================================================
 * END PRODUCTION AUTOMATION ENGINE
 * ============================================================================
 */