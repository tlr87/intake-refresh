/**
 * ============================================================================
 * FormSchemaTools.gs
 * ============================================================================
 *
 * PHASE 4
 *
 * Compares the live Google Form against FIELD_SCHEMA.
 *
 * IMPORTANT:
 *   - READ ONLY
 *   - Does NOT modify the Google Form
 *   - Does NOT modify FIELD_SCHEMA
 *   - Does NOT modify Script Properties
 *
 * Run:
 *
 *     checkFormSchema()
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * MAIN FORM SCHEMA CHECK
 * ============================================================================
 */
function checkFormSchema() {

  const formConfig =
    getInitialData().FORM_CONFIG || {};

  const settings =
    formConfig.settings || {};

  const formUrl =
    settings.formBaseUrl;


  if (!formUrl) {

    throw new Error(
      'FORM_CONFIG.settings.formBaseUrl is missing.'
    );

  }


  const formId =
    extractFormId_(formUrl);


  if (!formId) {

    throw new Error(
      'Could not extract Google Form ID from formBaseUrl.'
    );

  }


  const form =
    FormApp.openById(formId);


  const liveItems =
    form.getItems();


  const configuredFields =
    FIELD_SCHEMA;


  const results = {

    formId:
      formId,

    formTitle:
      form.getTitle(),

    totalLiveItems:
      liveItems.length,

    totalConfigured:
      configuredFields.length,

    matched: [],

    newFields: [],

    missingFields: [],

    duplicateEntryIds: [],

    duplicateTitles: [],

    details: []

  };


  // ==========================================================================
  // Build lookup maps
  // ==========================================================================

  const schemaByEntryId = {};

  const schemaByTitle = {};

  const liveByTitle = {};

  const liveById = {};


  configuredFields.forEach(function(field) {

    const entryId =
      String(field.entryId || '').trim();

    const title =
      normaliseFormTitle_(
        field.title
      );


    if (entryId) {

      if (schemaByEntryId[entryId]) {

        results.duplicateEntryIds.push(
          entryId
        );

      }

      schemaByEntryId[entryId] =
        field;

    }


    if (title) {

      if (schemaByTitle[title]) {

        results.duplicateTitles.push(
          field.title
        );

      }

      schemaByTitle[title] =
        field;

    }

  });


  // ==========================================================================
  // Inspect live Form
  // ==========================================================================

  liveItems.forEach(function(item) {

    const title =
      String(
        item.getTitle() || ''
      ).trim();


    const titleNormalised =
      normaliseFormTitle_(
        title
      );


    const itemId =
      String(
        item.getId()
      );


    liveByTitle[titleNormalised] =
      item;


    liveById[itemId] =
      item;


    const schemaField =
      schemaByTitle[titleNormalised];


    if (schemaField) {

      results.matched.push({

        key:
          schemaField.key,

        title:
          title,

        entryId:
          schemaField.entryId,

        liveItemId:
          itemId,

        type:
          getGoogleFormItemType_(item),

        status:
          'MATCHED'

      });

    } else {

      results.newFields.push({

        title:
          title,

        itemId:
          itemId,

        type:
          getGoogleFormItemType_(item),

        suggestedKey:
          suggestFieldKey_(title),

        suggestedLabel:
          suggestFieldLabel_(title),

        suggestedSection:
          suggestFieldSection_(title),

        suggestedSchema:
          buildSuggestedFieldSchema_(item)

      });

    }

  });


  // ==========================================================================
  // Find schema fields missing from live Form
  // ==========================================================================

  configuredFields.forEach(function(field) {

    const title =
      normaliseFormTitle_(
        field.title
      );


    if (!liveByTitle[title]) {

      results.missingFields.push({

        key:
          field.key,

        title:
          field.title,

        entryId:
          field.entryId,

        type:
          field.type

      });

    }

  });


  // ==========================================================================
  // Output
  // ==========================================================================

  logFormSchemaResults_(
    results
  );


  return results;

}


/**
 * ============================================================================
 * Extract Form ID
 * ============================================================================
 */
function extractFormId_(url) {

  if (!url) {
    return '';
  }


  const text =
    String(url).trim();


  const publishedMatch =
    text.match(
      /\/d\/e\/([^\/]+)/
    );


  if (publishedMatch) {

    return publishedMatch[1];

  }


  const standardMatch =
    text.match(
      /\/d\/([^\/]+)/
    );


  if (standardMatch) {

    return standardMatch[1];

  }


  return '';

}


/**
 * ============================================================================
 * Normalise Form Title
 * ============================================================================
 */
function normaliseFormTitle_(value) {

  return String(
    value || ''
  )

    .trim()

    .replace(
      /\s+/g,
      ' '
    )

    .toLowerCase();

}


/**
 * ============================================================================
 * Get Google Form item type
 * ============================================================================
 */
function getGoogleFormItemType_(item) {

  const type =
    item.getType();


  switch (type) {

    case FormApp.ItemType.TEXT:
      return 'text';

    case FormApp.ItemType.PARAGRAPH_TEXT:
      return 'paragraph';

    case FormApp.ItemType.MULTIPLE_CHOICE:
      return 'multiple_choice';

    case FormApp.ItemType.CHECKBOX:
      return 'checkbox';

    case FormApp.ItemType.LIST:
      return 'dropdown';

    case FormApp.ItemType.DATE:
      return 'date';

    case FormApp.ItemType.TIME:
      return 'time';

    case FormApp.ItemType.DATETIME:
      return 'datetime';

    case FormApp.ItemType.SCALE:
      return 'scale';

    case FormApp.ItemType.GRID:
      return 'grid';

    case FormApp.ItemType.CHECKBOX_GRID:
      return 'checkbox_grid';

    case FormApp.ItemType.FILE_UPLOAD:
      return 'file_upload';

    case FormApp.ItemType.SECTION_HEADER:
      return 'section_header';

    case FormApp.ItemType.PAGE_BREAK:
      return 'page_break';

    case FormApp.ItemType.IMAGE:
      return 'image';

    case FormApp.ItemType.VIDEO:
      return 'video';

    case FormApp.ItemType.TITLE:
      return 'title';

    default:
      return String(
        type
      );

  }

}


/**
 * ============================================================================
 * Suggest application key
 * ============================================================================
 */
function suggestFieldKey_(title) {

  let key =
    String(title || '')
      .toLowerCase()
      .trim();


  key =
    key
      .replace(
        /[^a-z0-9]+(.)/g,
        function(match, character) {

          return character
            ? character.toUpperCase()
            : '';

        }
      );


  key =
    key.replace(
      /[^a-zA-Z0-9]/g,
      ''
    );


  if (!key) {

    key =
      'newField';

  }


  if (
    /^[0-9]/.test(key)
  ) {

    key =
      'field' +
      key;

  }


  return key;

}


/**
 * ============================================================================
 * Suggest display label
 * ============================================================================
 */
function suggestFieldLabel_(title) {

  const text =
    String(title || '')
      .trim();


  if (!text) {
    return 'New Field';
  }


  return text
    .replace(
      /\?$/,
      ''
    )
    .trim();

}


/**
 * ============================================================================
 * Suggest application section
 * ============================================================================
 */
function suggestFieldSection_(title) {

  const text =
    normaliseFormTitle_(
      title
    );


  const clientTerms = [

    'name',
    'email',
    'phone',
    'address',
    'location',
    'contact',
    'used before',
    'contacting'

  ];


  const securityTerms = [

    'security',
    'website url',
    'leave this field empty',
    'honeypot'

  ];


  const requestTerms = [

    'help',
    'achieve',
    'goal',
    'urgent',
    'urgency',
    'problem',
    'service',
    'project',
    'budget'

  ];


  if (
    securityTerms.some(function(term) {

      return text.indexOf(term) !== -1;

    })
  ) {

    return 'security';

  }


  if (
    clientTerms.some(function(term) {

      return text.indexOf(term) !== -1;

    })
  ) {

    return 'client';

  }


  if (
    requestTerms.some(function(term) {

      return text.indexOf(term) !== -1;

    })
  ) {

    return 'request';

  }


  return 'request';

}


/**
 * ============================================================================
 * Build suggested FIELD_SCHEMA entry
 * ============================================================================
 */
function buildSuggestedFieldSchema_(item) {

  const title =
    String(
      item.getTitle() || ''
    ).trim();


  const key =
    suggestFieldKey_(
      title
    );


  const label =
    suggestFieldLabel_(
      title
    );


  const section =
    suggestFieldSection_(
      title
    );


  const type =
    getGoogleFormItemType_(
      item
    );


  return {

    key:
      key,

    formField:
      'form_' +
      key,

    title:
      title,

    entryId:
      'entry.' +
      item.getId(),

    type:
      type,

    aliases: [

      title,

      key

    ],

    label:
      label,

    section:
      section,

    default:
      'Not provided'

  };

}


/**
 * ============================================================================
 * Log results
 * ============================================================================
 */
function logFormSchemaResults_(results) {

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'FORM SCHEMA CHECK'
  );


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Form: ' +
    results.formTitle
  );


  Logger.log(
    'Live form items: ' +
    results.totalLiveItems
  );


  Logger.log(
    'FIELD_SCHEMA fields: ' +
    results.totalConfigured
  );


  Logger.log(
    '------------------------------------------------------------'
  );


  Logger.log(
    'MATCHED: ' +
    results.matched.length
  );


  results.matched.forEach(function(field) {

    Logger.log(

      '✔ ' +
      field.key +
      ' | ' +
      field.title +
      ' | ' +
      field.entryId +
      ' | ' +
      field.type

    );

  });


  Logger.log(
    '------------------------------------------------------------'
  );


  Logger.log(
    'NEW / UNACCOUNTED: ' +
    results.newFields.length
  );


  results.newFields.forEach(function(field) {

    Logger.log(

      '⚠ NEW: ' +
      field.title

    );


    Logger.log(

      '  Item ID: ' +
      field.itemId

    );


    Logger.log(

      '  Suggested key: ' +
      field.suggestedKey

    );


    Logger.log(

      '  Suggested type: ' +
      field.type

    );


    Logger.log(

      '  Suggested section: ' +
      field.suggestedSection

    );


    Logger.log(
      '  Suggested FIELD_SCHEMA:'
    );


    Logger.log(
      JSON.stringify(
        field.suggestedSchema,
        null,
        2
      )
    );

  });


  Logger.log(
    '------------------------------------------------------------'
  );


  Logger.log(
    'MISSING FROM LIVE FORM: ' +
    results.missingFields.length
  );


  results.missingFields.forEach(function(field) {

    Logger.log(

      '✖ MISSING: ' +
      field.key +
      ' | ' +
      field.title +
      ' | ' +
      field.entryId

    );

  });


  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.duplicateEntryIds.length
  ) {

    Logger.log(
      '✖ DUPLICATE ENTRY IDS: ' +
      results.duplicateEntryIds.join(', ')
    );

  }


  if (
    results.duplicateTitles.length
  ) {

    Logger.log(
      '✖ DUPLICATE TITLES: ' +
      results.duplicateTitles.join(', ')
    );

  }


  Logger.log(
    '============================================================'
  );


  if (
    results.newFields.length === 0 &&
    results.missingFields.length === 0 &&
    results.duplicateEntryIds.length === 0 &&
    results.duplicateTitles.length === 0
  ) {

    Logger.log(
      '✔ FORM AND FIELD_SCHEMA ARE IN SYNC'
    );

  } else {

    Logger.log(
      '⚠ FORM AND FIELD_SCHEMA REQUIRE ATTENTION'
    );

  }


  Logger.log(
    '============================================================'
  );

}