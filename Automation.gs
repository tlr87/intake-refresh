/**
 * ============================================================================
 * RD3 TECH — AUTOMATION ENGINE
 * ============================================================================
 *
 * FORM → DRAFT_FIELD_SCHEMA SYNCHRONISATION
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
 * SCRIPT PROPERTIES
 * -----------------
 *
 *   DRAFT_FIELD_SCHEMA
 *       Current working schema stored as JSON.
 *
 *   BACKUP_DRAFT_FIELD_SCHEMA
 *       Backup of DRAFT_FIELD_SCHEMA before an apply.
 *
 *   RD3_FORM_SYNC_PLAN
 *       Current approved/unapproved sync plan.
 *
 *
 * IMPORTANT
 * ---------
 *
 * DRAFT_FIELD_SCHEMA is NOT rewritten in the Apps Script source.
 *
 * The JavaScript source contains INITIAL_DRAFT_FIELD_SCHEMA only as the
 * initial seed if the DRAFT_FIELD_SCHEMA Script Property does not exist.
 *
 * Once DRAFT_FIELD_SCHEMA exists in Script Properties, that JSON is the
 * working schema.
 *
 *
 * SYNC RULES
 * ----------
 *
 * 1. Existing Form questions are matched using entryId.
 *
 * 2. Existing application keys are preserved.
 *
 * 3. Changed Form titles update the schema title/label.
 *
 * 4. New Form questions are added to the schema.
 *
 * 5. Removed Form questions are removed from the working schema.
 *
 * 6. BACKUP_DRAFT_FIELD_SCHEMA preserves the previous schema before apply.
 *
 * 7. verifyFormSync() expects the Form and DRAFT_FIELD_SCHEMA to match.
 *
 * ============================================================================
 */


/* ============================================================================
 * CONFIGURATION
 * ========================================================================== */

var AUTOMATION_CONFIG = {

  draftPropertyKey:
    'DRAFT_FIELD_SCHEMA',

  backupPropertyKey:
    'BACKUP_DRAFT_FIELD_SCHEMA',

  syncPlanPropertyKey:
    'RD3_FORM_SYNC_PLAN',

  requireApproval:
    true

};


/* ============================================================================
 * INITIAL DRAFT FIELD SCHEMA
 * ============================================================================
 *
 * This is ONLY used if DRAFT_FIELD_SCHEMA does not yet exist in
 * Script Properties.
 *
 * Once DRAFT_FIELD_SCHEMA exists, Script Properties becomes the working copy.
 * ========================================================================== */

var INITIAL_DRAFT_FIELD_SCHEMA = [

  /* --------------------------------------------------------------------------
   * CLIENT
   * ------------------------------------------------------------------------ */

  {
    key: 'name',
    formField: 'form_name',
    title: 'Name',
    entryId: 'entry.943904063',
    type: 'text',
    aliases: [
      'name',
      'full name'
    ],
    label: 'Full Name',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'email',
    formField: 'form_email',
    title: 'Email',
    entryId: 'entry.2015577610',
    type: 'text',
    aliases: [
      'email',
      'email address'
    ],
    label: 'Email Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'phone',
    formField: 'form_phone',
    title: 'Phone',
    entryId: 'entry.38229443',
    type: 'text',
    aliases: [
      'phone',
      'phone number'
    ],
    label: 'Phone Number',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'location',
    formField: 'form_location',
    title: 'Address / Location:',
    entryId: 'entry.1374165657',
    type: 'text',
    aliases: [
      'location',
      'address',
      'address / location'
    ],
    label: 'Location / Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactPreference',
    formField: 'form_contactPreference',
    title: 'How would you prefer us to contact you?',
    entryId: 'entry.786887502',
    type: 'dropdown',
    aliases: [
      'contactPreference',
      'preferredContact',
      'how would you prefer us to contact you',
      'prefer us to contact',
      'preferred contact'
    ],
    label: 'Preferred Contact',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactingAs',
    formField: 'form_clientType',
    title: 'I am contacting RD3 Tech as:',
    entryId: 'entry.1187723509',
    type: 'dropdown',
    aliases: [
      'clientType',
      'contactingAs',
      'i am contacting rd3 tech as',
      'contacting as'
    ],
    label: 'Contacting As',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'usedBefore',
    formField: 'form_usedBefore',
    title: 'Have you used RD3 Tech before?',
    entryId: 'entry.1059088719',
    type: 'dropdown',
    aliases: [
      'usedBefore',
      'have you used rd3 tech before',
      'previous customer',
      'used before'
    ],
    label: 'Previous Customer',
    section: 'client',
    default: 'No'
  },


  /* --------------------------------------------------------------------------
   * REQUEST
   * ------------------------------------------------------------------------ */

  {
    key: 'helpCategory',
    formField: 'form_helpCategory',
    title: 'What can we help you with?',
    entryId: 'entry.534946962',
    type: 'dropdown',
    aliases: [
      'helpCategory',
      'what can we help you with',
      'need help with',
      'help with'
    ],
    label: 'Need Help With',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'userGoal',
    formField: 'form_userGoal',
    title: 'What Are You Trying To Achieve?',
    entryId: 'entry.1272748221',
    type: 'paragraph',
    aliases: [
      'userGoal',
      'goal',
      'details',
      'what are you trying to achieve',
      'trying to achieve',
      'desired outcome'
    ],
    label: 'Desired Outcome / Goal',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'urgency',
    formField: 'form_urgency',
    title: 'How Urgent Is This For You?',
    entryId: 'entry.1183805901',
    type: 'dropdown',
    aliases: [
      'urgency',
      'how urgent is this for you',
      'how urgent'
    ],
    label: 'How Urgent Is This?',
    section: 'request',
    default: 'Medium'
  },


  /* --------------------------------------------------------------------------
   * HONEYPOT
   * ------------------------------------------------------------------------ */

  {
    key: 'honeypot',
    formField: 'form_honeypot',
    title:
      'Website URL  \n\n\nSecurity Check: Please leave this field empty.',
    entryId: 'entry.663587071',
    type: 'text',
    aliases: [
      'website url',
      'security check',
      'please leave this field empty',
      'leave blank',
      'honeypot'
    ],
    label: 'Honeypot',
    section: 'security',
    default: ''
  }

];


/* ============================================================================
 * PUBLIC FUNCTION #1
 * BACKUP FORM
 * ========================================================================== */

/**
 * Creates a JSON backup of the current DRAFT_FIELD_SCHEMA.
 *
 * Run this before applying a sync if you want an explicit backup.
 *
 * applyFormSync() also performs a backup automatically.
 */
function backupForm() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — BACKUP FORM'
  );
  Logger.log(
    '============================================================'
  );
  Logger.log('');

  var currentSchema =
    getDraftFieldSchema_();

  if (!Array.isArray(currentSchema)) {

    throw new Error(
      'Cannot create backup because DRAFT_FIELD_SCHEMA is not an array.'
    );

  }

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

function checkFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — CHECK FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var formData =
    readCurrentForm_();

  var draftSchema =
    getDraftFieldSchema_();

  var comparison =
    compareFormToDraftSchema_(
      formData.fields,
      draftSchema
    );

  logSyncPlan_(
    comparison
  );

  saveSyncPlan_(
    comparison
  );

  Logger.log('');

  if (comparison.passed) {

    Logger.log(
      '✅ FORM AND DRAFT_FIELD_SCHEMA ARE ALIGNED'
    );

  } else {

    Logger.log(
      '⚠️ SYNC REQUIRED'
    );

    Logger.log(
      'Review the changes.'
    );

    Logger.log(
      'Then run approveFormSync().'
    );

  }

  Logger.log(
    '============================================================'
  );

  return comparison;
}


/* ============================================================================
 * PUBLIC FUNCTION #3
 * APPROVE
 * ========================================================================== */

function approveFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — APPROVE FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var plan =
    getSavedSyncPlan_();

  if (!plan) {

    throw new Error(
      'No sync plan exists. Run checkFormSync() first.'
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

  saveSyncPlan_(
    plan
  );

  Logger.log('');
  Logger.log(
    '✅ FORM SYNC APPROVED'
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
 * APPLY
 * ========================================================================== */

function applyFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — APPLY FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var plan =
    getSavedSyncPlan_();

  if (!plan) {

    throw new Error(
      'No sync plan exists. Run checkFormSync() first.'
    );

  }

  if (plan.passed) {

    Logger.log(
      '✅ NO CHANGES REQUIRED'
    );

    return getDraftFieldSchema_();

  }

  if (
    AUTOMATION_CONFIG.requireApproval &&
    plan.approved !== true
  ) {

    throw new Error(
      'FORM SYNC HAS NOT BEEN APPROVED. ' +
      'Run approveFormSync() first.'
    );

  }


  /* --------------------------------------------------------------------------
   * STEP 1 — BACKUP CURRENT SCHEMA
   * ------------------------------------------------------------------------ */

  backupForm();


  /* --------------------------------------------------------------------------
   * STEP 2 — VERIFY BACKUP
   * ------------------------------------------------------------------------ */

  var backup =
    getBackupDraftFieldSchema_();

  var currentSchema =
    getDraftFieldSchema_();

  if (
    JSON.stringify(backup) !==
    JSON.stringify(currentSchema)
  ) {

    throw new Error(
      'Backup verification failed. ' +
      'DRAFT_FIELD_SCHEMA was NOT changed.'
    );

  }

  Logger.log('');
  Logger.log(
    '✅ CURRENT SCHEMA BACKUP VERIFIED'
  );


  /* --------------------------------------------------------------------------
   * STEP 3 — BUILD UPDATED SCHEMA
   * ------------------------------------------------------------------------ */

  var updatedSchema =
    buildUpdatedDraftSchema_(
      currentSchema,
      plan
    );


  /* --------------------------------------------------------------------------
   * STEP 4 — SAVE DIRECTLY TO SCRIPT PROPERTY
   * ------------------------------------------------------------------------ */

  saveDraftFieldSchema_(
    updatedSchema
  );


  /* --------------------------------------------------------------------------
   * STEP 5 — READ BACK AND VERIFY WRITE
   * ------------------------------------------------------------------------ */

  var savedSchema =
    getDraftFieldSchema_();

  if (
    JSON.stringify(savedSchema) !==
    JSON.stringify(updatedSchema)
  ) {

    throw new Error(
      'DRAFT_FIELD_SCHEMA write verification failed.'
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
    '✅ DRAFT_FIELD_SCHEMA UPDATED'
  );

  Logger.log(
    'Fields now stored: ' +
    savedSchema.length
  );

  Logger.log(
    'Property: DRAFT_FIELD_SCHEMA'
  );

  Logger.log('');

  Logger.log(
    'No Apps Script source code was modified.'
  );

  Logger.log(
    'No UrlFetchApp was used.'
  );

  Logger.log(
    'No Apps Script API was used.'
  );

  Logger.log(
    '============================================================'
  );

  return savedSchema;
}


/* ============================================================================
 * PUBLIC FUNCTION #5
 * VERIFY
 * ========================================================================== */

function verifyFormSync() {

  Logger.log('');
  Logger.log(
    '============================================================'
  );
  Logger.log(
    'RD3 TECH — VERIFY FORM SYNC'
  );
  Logger.log(
    '============================================================'
  );

  var formData =
    readCurrentForm_();

  var draftSchema =
    getDraftFieldSchema_();

  var comparison =
    compareFormToDraftSchema_(
      formData.fields,
      draftSchema
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
      '✅ VERIFY PASSED'
    );

    Logger.log(
      'FORM AND DRAFT_FIELD_SCHEMA ARE ALIGNED'
    );

    Logger.log(
      '============================================================'
    );

  } else {

    Logger.log(
      '============================================================'
    );

    Logger.log(
      '❌ VERIFY FAILED'
    );

    Logger.log(
      'FORM AND DRAFT_FIELD_SCHEMA ARE STILL DIFFERENT'
    );

    Logger.log(
      '============================================================'
    );

  }

  return comparison;
}


/* ============================================================================
 * GET DRAFT FIELD SCHEMA
 * ========================================================================== */

function getDraftFieldSchema_() {

  var properties =
    PropertiesService
      .getScriptProperties();

  var stored =
    properties.getProperty(
      AUTOMATION_CONFIG.draftPropertyKey
    );


  /* --------------------------------------------------------------------------
   * EXISTING SCRIPT PROPERTY
   * ------------------------------------------------------------------------ */

  if (stored) {

    try {

      var parsed =
        JSON.parse(
          stored
        );

      if (!Array.isArray(parsed)) {

        throw new Error(
          'DRAFT_FIELD_SCHEMA JSON is not an array.'
        );

      }

      return parsed;

    } catch (error) {

      throw new Error(
        'Unable to parse DRAFT_FIELD_SCHEMA.\n' +
        error.message
      );

    }

  }


  /* --------------------------------------------------------------------------
   * FIRST RUN
   * ------------------------------------------------------------------------ */

  var initial =
    JSON.parse(
      JSON.stringify(
        INITIAL_DRAFT_FIELD_SCHEMA
      )
    );

  saveDraftFieldSchema_(
    initial
  );

  Logger.log(
    'ℹ️ DRAFT_FIELD_SCHEMA did not exist.'
  );

  Logger.log(
    'Initial schema copied into Script Properties.'
  );

  return initial;
}


/* ============================================================================
 * SAVE DRAFT FIELD SCHEMA
 * ========================================================================== */

function saveDraftFieldSchema_(
  schema
) {

  if (!Array.isArray(schema)) {

    throw new Error(
      'DRAFT_FIELD_SCHEMA must be an array.'
    );

  }

  var json =
    JSON.stringify(
      schema
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AUTOMATION_CONFIG.draftPropertyKey,
      json
    );
}


/* ============================================================================
 * GET BACKUP
 * ========================================================================== */

function getBackupDraftFieldSchema_() {

  var stored =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        AUTOMATION_CONFIG.backupPropertyKey
      );

  if (!stored) {

    throw new Error(
      'BACKUP_DRAFT_FIELD_SCHEMA does not exist.'
    );

  }

  try {

    var parsed =
      JSON.parse(
        stored
      );

    if (!Array.isArray(parsed)) {

      throw new Error(
        'Backup JSON is not an array.'
      );

    }

    return parsed;

  } catch (error) {

    throw new Error(
      'Unable to parse BACKUP_DRAFT_FIELD_SCHEMA.\n' +
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

  if (match && match[1]) {

    return match[1];

  }

  match =
    formUrl.match(
      /\/forms\/d\/([a-zA-Z0-9_-]+)/
    );

  if (match && match[1]) {

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

function compareFormToDraftSchema_(
  formFields,
  draftFields
) {

  var result = {

    passed:
      false,

    formFieldCount:
      formFields.length,

    draftFieldCount:
      draftFields.length,

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

  var draftByEntryId =
    createEntryIdLookup_(
      draftFields
    );


  /* --------------------------------------------------------------------------
   * FORM → DRAFT
   * ------------------------------------------------------------------------ */

  formFields.forEach(
    function(formField) {

      var draftField =
        draftByEntryId[
          formField.entryId
        ];


      /* ----------------------------------------------------------------------
       * NEW FORM QUESTION
       * -------------------------------------------------------------------- */

      if (!draftField) {

        result.added.push({

          form:
            formField,

          suggestedKey:
            suggestApplicationKey_(
              formField,
              draftFields
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
          draftField
        );

      if (
        differences.length > 0
      ) {

        result.changed.push({

          key:
            draftField.key,

          entryId:
            draftField.entryId,

          differences:
            differences,

          form:
            formField,

          draft:
            draftField

        });

      } else {

        result.unchanged.push({

          key:
            draftField.key,

          title:
            formField.title,

          entryId:
            formField.entryId

        });

      }

    }
  );


  /* --------------------------------------------------------------------------
   * DRAFT → FORM
   *
   * Anything in DRAFT_FIELD_SCHEMA that no longer exists in the Form is
   * classified as removed.
   * ------------------------------------------------------------------------ */

  draftFields.forEach(
    function(draftField) {

      if (
        !formByEntryId[
          draftField.entryId
        ]
      ) {

        result.removed.push({

          key:
            draftField.key,

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
 * BUILD UPDATED DRAFT SCHEMA
 * ========================================================================== */

/**
 * Builds the new DRAFT_FIELD_SCHEMA from the current schema and sync plan.
 *
 * RULES
 * -----
 *
 * ADD:
 *   Add the new Form field.
 *
 * CHANGE:
 *   Update the existing field while preserving its application key.
 *
 * REMOVE:
 *   Remove the field completely from DRAFT_FIELD_SCHEMA.
 *
 * BACKUP:
 *   The previous schema has already been saved to
 *   BACKUP_DRAFT_FIELD_SCHEMA before this function runs.
 */
function buildUpdatedDraftSchema_(
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
        '➕ ADDING NEW FIELD: ' +
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

      if (index === -1) {

        return;

      }

      var existing =
        updated[index];

      var formField =
        change.form;


      /*
       * PRESERVE APPLICATION IDENTITY.
       *
       * Example:
       *
       *   key: name
       *
       * remains:
       *
       *   key: name
       *
       * even when the Form title changes.
       */

      existing.title =
        formField.title;

      existing.entryId =
        formField.entryId;

      existing.type =
        formField.type;


      /*
       * Preserve existing formField.
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


      /*
       * Remove any legacy inactive markers.
       */

      delete existing.inactive;

      delete existing.removedFromForm;


      Logger.log(
        '✏️ UPDATING EXISTING FIELD: ' +
        existing.key +
        ' — ' +
        formField.title
      );

    }
  );


  /* --------------------------------------------------------------------------
   * REMOVALS
   * --------------------------------------------------------------------------
   *
   * THIS IS THE IMPORTANT CHANGE.
   *
   * Removed Form questions are now removed from the WORKING schema.
   *
   * They are NOT retained with:
   *
   *   inactive: true
   *
   * Instead they disappear from DRAFT_FIELD_SCHEMA.
   *
   * The previous version is preserved in:
   *
   *   BACKUP_DRAFT_FIELD_SCHEMA
   *
   * ------------------------------------------------------------------------ */

  /*
   * Remove from highest index to lowest index.
   *
   * This prevents array index shifting from causing problems.
   */

  var removalIndexes =
    [];

  plan.removed.forEach(
    function(change) {

      var index =
        findSchemaIndexByEntryId_(
          updated,
          change.entryId
        );

      if (index !== -1) {

        removalIndexes.push(
          index
        );

      }

    }
  );


  /*
   * Sort descending.
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
        '➖ REMOVING FIELD FROM DRAFT_FIELD_SCHEMA: ' +
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
 * FIND SCHEMA FIELD
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
  draftField
) {

  var differences =
    [];

  compareProperty_(
    differences,
    'title',
    formField.title,
    draftField.title
  );

  compareProperty_(
    differences,
    'type',
    formField.type,
    draftField.type
  );

  return differences;
}


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

  if (
    a !== b
  ) {

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
 * APPLICATION KEY GENERATION
 * ========================================================================== */

/**
 * Used when a NEW Form question is encountered.
 *
 * Existing application keys are never regenerated.
 */
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


/**
 * Converts a NEW Form title into an application key.
 */
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

      if (index === 0) {

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
 * UNIQUE KEY
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

    return JSON.parse(
      stored
    );

  } catch (error) {

    throw new Error(
      'Saved sync plan is invalid.\n' +
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
    'FORM → DRAFT_FIELD_SCHEMA COMPARISON'
  );

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'Live Form Fields: ' +
    comparison.formFieldCount
  );

  Logger.log(
    'Draft Fields: ' +
    comparison.draftFieldCount
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
      '✅ FORM AND DRAFT_FIELD_SCHEMA ARE ALIGNED'
    );

  } else {

    Logger.log(
      '⚠️ SYNC REQUIRED'
    );

  }

  Logger.log(
    '------------------------------------------------------------'
  );
}


/* ============================================================================
 * END AUTOMATION ENGINE
 * ============================================================================
 */