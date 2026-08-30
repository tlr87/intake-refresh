/**
 * ============================================================================
 * FormSchemaTools.gs
 * ============================================================================
 *
 * PHASE 4
 *
 * Read-only tools for comparing the live Google Form against FIELD_SCHEMA.
 *
 * FIELD_SCHEMA is the source of truth for application fields.
 *
 * IMPORTANT:
 *   - Does NOT modify the Google Form.
 *   - Does NOT modify FIELD_SCHEMA.
 *   - Does NOT modify Script Properties.
 *   - Entry IDs are checked, but are NOT used as the primary field identity.
 *
 * PRIMARY FIELD IDENTITY:
 *   title + aliases
 *
 * ENTRY ID:
 *   Used to detect changes to the Google Forms response entry ID.
 *
 * Run:
 *
 *   checkFormSchema()
 *   testDiscoverNewFormFields()
 *   testRawFormData()
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * MAIN FORM SCHEMA CHECK
 * ============================================================================
 */
function checkFormSchema() {

  const form =
    getSchemaCheckForm_();

  const liveItems =
    form.getItems();

  const configuredFields =
    FIELD_SCHEMA;


  const liveQuestions = [];

  const liveNonQuestions = [];


  // ==========================================================================
  // Separate questions from non-question items
  // ==========================================================================

  liveItems.forEach(function(item) {

    const type =
      item.getType();

    const questionInfo =
      getRawQuestionInfo_(
        item,
        type
      );


    if (questionInfo) {

      liveQuestions.push(item);

    } else {

      liveNonQuestions.push(item);

    }

  });


  // ==========================================================================
  // Build FIELD_SCHEMA lookup
  // ==========================================================================

  const schemaLookup =
    buildSchemaLookup_(
      configuredFields
    );


  const results = {

    formId:
      form.getId(),

    formTitle:
      form.getTitle(),

    totalLiveItems:
      liveItems.length,

    totalLiveQuestions:
      liveQuestions.length,

    totalLiveNonQuestions:
      liveNonQuestions.length,

    totalConfigured:
      configuredFields.length,

    matched:
      [],

    newFields:
      [],

    missingFields:
      [],

    entryIdChanges:
      [],

    typeChanges:
      [],

    duplicateEntryIds:
      [],

    duplicateTitles:
      [],

    details:
      []

  };


  // ==========================================================================
  // Track which FIELD_SCHEMA fields were found
  // ==========================================================================

  const foundSchemaKeys = {};


  // ==========================================================================
  // Inspect every live question
  // ==========================================================================

  liveQuestions.forEach(function(item) {

    const title =
      String(
        item.getTitle() || ''
      ).trim();


    const normalisedTitle =
      normaliseFormTitle_(
        title
      );


    const liveEntryId =
      'entry.' +
      item.getId();


    const liveType =
      getGoogleFormItemType_(
        item
      );


    const schemaField =
      findSchemaFieldForLiveItem_(
        item,
        schemaLookup
      );


    // ========================================================================
    // KNOWN FIELD
    // ========================================================================

    if (schemaField) {

      foundSchemaKeys[
        schemaField.key
      ] = true;


      const status = [];


      // ----------------------------------------------------------------------
      // Entry ID comparison
      // ----------------------------------------------------------------------

      const schemaEntryId =
        String(
          schemaField.entryId || ''
        ).trim();


      const entryIdChanged =
        schemaEntryId &&
        schemaEntryId !== liveEntryId;


      if (entryIdChanged) {

        status.push(
          'ENTRY_ID_CHANGED'
        );


        results.entryIdChanges.push({

          key:
            schemaField.key,

          title:
            title,

          oldEntryId:
            schemaEntryId,

          newEntryId:
            liveEntryId

        });

      }


      // ----------------------------------------------------------------------
      // Type comparison
      // ----------------------------------------------------------------------

      const schemaType =
        String(
          schemaField.type || ''
        ).trim();


      const typeChanged =
        schemaType &&
        schemaType !== liveType;


      if (typeChanged) {

        status.push(
          'TYPE_CHANGED'
        );


        results.typeChanges.push({

          key:
            schemaField.key,

          title:
            title,

          oldType:
            schemaType,

          newType:
            liveType

        });

      }


      results.matched.push({

        key:
          schemaField.key,

        title:
          title,

        entryId:
          liveEntryId,

        type:
          liveType,

        entryIdChanged:
          entryIdChanged,

        typeChanged:
          typeChanged,

        status:
          status

      });


      return;

    }


    // ========================================================================
    // NEW FIELD
    // ========================================================================

    const suggestedSchema =
      buildSuggestedFieldSchema_(
        item
      );


    const questionInfo =
      getRawQuestionInfo_(
        item,
        item.getType()
      );


    suggestedSchema.question =
      questionInfo;


    results.newFields.push({

      title:
        title,

      itemId:
        String(
          item.getId()
        ),

      entryId:
        liveEntryId,

      type:
        liveType,

      suggestedKey:
        suggestFieldKey_(
          title
        ),

      suggestedSection:
        suggestFieldSection_(
          title
        ),

      question:
        questionInfo,

      suggestedSchema:
        suggestedSchema

    });

  });


  // ==========================================================================
  // Find FIELD_SCHEMA fields that are no longer in the live form
  // ==========================================================================

  configuredFields.forEach(function(field) {

    if (
      !foundSchemaKeys[field.key]
    ) {

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
  // Duplicate checks
  // ==========================================================================

  findDuplicateSchemaEntryIds_(
    configuredFields,
    results
  );


  findDuplicateSchemaTitles_(
    configuredFields,
    results
  );


  // ==========================================================================
  // Output
  // ==========================================================================

  logCleanFormSchemaResults_(
    results
  );


  return results;

}


/**
 * ============================================================================
 * Get the Google Form used by schema tools
 * ============================================================================
 *
 * IMPORTANT:
 *   FORM_CONFIG has been removed.
 *
 *   Keep the form ID in one place for these development tools until we decide
 *   where the permanent form configuration should live.
 *
 * ============================================================================
 */
function getSchemaCheckForm_() {

  const formId =
    '10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc';


  return FormApp.openById(
    formId
  );

}


/**
 * ============================================================================
 * Build FIELD_SCHEMA lookup maps
 * ============================================================================
 */
function buildSchemaLookup_(fields) {

  const lookup = {

    byTitle: {},

    byAlias: {},

    byEntryId: {}

  };


  fields.forEach(function(field) {

    const title =
      normaliseFormTitle_(
        field.title
      );


    if (title) {

      if (!lookup.byTitle[title]) {

        lookup.byTitle[title] =
          field;

      }

    }


    const aliases =
      Array.isArray(field.aliases)
        ? field.aliases
        : [];


    aliases.forEach(function(alias) {

      const normalisedAlias =
        normaliseFormTitle_(
          alias
        );


      if (
        normalisedAlias &&
        !lookup.byAlias[normalisedAlias]
      ) {

        lookup.byAlias[normalisedAlias] =
          field;

      }

    });


    const entryId =
      String(
        field.entryId || ''
      ).trim();


    if (entryId) {

      if (!lookup.byEntryId[entryId]) {

        lookup.byEntryId[entryId] =
          field;

      }

    }

  });


  return lookup;

}


/**
 * ============================================================================
 * Find the FIELD_SCHEMA field represented by a live Form item
 * ============================================================================
 *
 * Matching priority:
 *
 *   1. Exact title
 *   2. FIELD_SCHEMA alias
 *
 * Entry ID is deliberately NOT used as the primary identity.
 *
 * ============================================================================
 */
function findSchemaFieldForLiveItem_(
  item,
  lookup
) {

  const title =
    String(
      item.getTitle() || ''
    ).trim();


  const normalisedTitle =
    normaliseFormTitle_(
      title
    );


  // --------------------------------------------------------------------------
  // Exact schema title
  // --------------------------------------------------------------------------

  if (
    lookup.byTitle[normalisedTitle]
  ) {

    return lookup.byTitle[
      normalisedTitle
    ];

  }


  // --------------------------------------------------------------------------
  // Alias
  // --------------------------------------------------------------------------

  if (
    lookup.byAlias[normalisedTitle]
  ) {

    return lookup.byAlias[
      normalisedTitle
    ];

  }


  // --------------------------------------------------------------------------
  // Special case:
  //
  // Allow punctuation / whitespace differences such as:
  //
  //   Address / Location
  //   Address / Location:
  //
  // --------------------------------------------------------------------------

  const simplifiedLiveTitle =
    simplifyFormTitle_(
      title
    );


  const fields =
    FIELD_SCHEMA;


  for (
    let i = 0;
    i < fields.length;
    i++
  ) {

    const field =
      fields[i];


    const candidates = [];


    if (field.title) {

      candidates.push(
        field.title
      );

    }


    if (
      Array.isArray(field.aliases)
    ) {

      field.aliases.forEach(function(alias) {

        candidates.push(
          alias
        );

      });

    }


    for (
      let j = 0;
      j < candidates.length;
      j++
    ) {

      if (
        simplifyFormTitle_(
          candidates[j]
        ) === simplifiedLiveTitle
      ) {

        return field;

      }

    }

  }


  return null;

}


/**
 * ============================================================================
 * Simplify a Form title for tolerant matching
 * ============================================================================
 */
function simplifyFormTitle_(value) {

  return String(
    value || ''
  )

    .trim()

    .replace(
      /\s+/g,
      ' '
    )

    .replace(
      /[:：]+$/g,
      ''
    )

    .replace(
      /\s+([?!.])$/g,
      '$1'
    )

    .toLowerCase();

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
    key.replace(
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
      /[：:]$/,
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
 * Duplicate FIELD_SCHEMA entry IDs
 * ============================================================================
 */
function findDuplicateSchemaEntryIds_(
  fields,
  results
) {

  const seen = {};


  fields.forEach(function(field) {

    const entryId =
      String(
        field.entryId || ''
      ).trim();


    if (!entryId) {

      return;

    }


    if (seen[entryId]) {

      results.duplicateEntryIds.push(
        entryId
      );

    }


    seen[entryId] =
      true;

  });

}


/**
 * ============================================================================
 * Duplicate FIELD_SCHEMA titles
 * ============================================================================
 */
function findDuplicateSchemaTitles_(
  fields,
  results
) {

  const seen = {};


  fields.forEach(function(field) {

    const title =
      normaliseFormTitle_(
        field.title
      );


    if (!title) {

      return;

    }


    if (seen[title]) {

      results.duplicateTitles.push(
        field.title
      );

    }


    seen[title] =
      true;

  });

}


/**
 * ============================================================================
 * CLEAN FORM SCHEMA RESULTS
 * ============================================================================
 */
function logCleanFormSchemaResults_(results) {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'FORM SCHEMA STATUS'
  );

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Form: ' +
    results.formTitle
  );


  Logger.log(
    ''
  );


  // ==========================================================================
  // Known questions
  // ==========================================================================

  Logger.log(
    'KNOWN QUESTIONS: ' +
    results.matched.length
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  results.matched.forEach(function(field) {

    Logger.log(
      '✔ ' +
      field.title
    );


    Logger.log(
      '  key: ' +
      field.key
    );


    Logger.log(
      '  type: ' +
      field.type
    );


    if (field.entryIdChanged) {

      Logger.log(
        '  entry ID: CHANGED'
      );

    } else {

      Logger.log(
        '  entry ID: OK'
      );

    }


    if (field.typeChanged) {

      Logger.log(
        '  type: CHANGED'
      );

    }

  });


  Logger.log(
    ''
  );


  // ==========================================================================
  // New questions
  // ==========================================================================

  Logger.log(
    'NEW QUESTIONS: ' +
    results.newFields.length
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.newFields.length === 0
  ) {

    Logger.log(
      'None'
    );

  }


  results.newFields.forEach(function(field) {

    Logger.log(
      '⚠ ' +
      field.title
    );


    Logger.log(
      '  suggested key: ' +
      field.suggestedKey
    );


    Logger.log(
      '  type: ' +
      field.type
    );


    Logger.log(
      '  entry ID: ' +
      field.entryId
    );


    if (
      field.question &&
      field.question.choices
    ) {

      Logger.log(
        '  choices:'
      );


      field.question.choices.forEach(function(choice) {

        Logger.log(
          '    • ' +
          choice
        );

      });

    }


    Logger.log(
      ''
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
    ''
  );


  // ==========================================================================
  // Missing questions
  // ==========================================================================

  Logger.log(
    'MISSING QUESTIONS: ' +
    results.missingFields.length
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.missingFields.length === 0
  ) {

    Logger.log(
      'None'
    );

  }


  results.missingFields.forEach(function(field) {

    Logger.log(
      '✖ ' +
      field.key +
      ' | ' +
      field.title
    );

  });


  Logger.log(
    ''
  );


  // ==========================================================================
  // Entry ID changes
  // ==========================================================================

  Logger.log(
    'ENTRY ID CHANGES: ' +
    results.entryIdChanges.length
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.entryIdChanges.length === 0
  ) {

    Logger.log(
      'None'
    );

  }


  results.entryIdChanges.forEach(function(change) {

    Logger.log(
      '⚠ ' +
      change.key +
      ' | ' +
      change.oldEntryId +
      ' → ' +
      change.newEntryId
    );

  });


  Logger.log(
    ''
  );


  // ==========================================================================
  // Type changes
  // ==========================================================================

  Logger.log(
    'TYPE CHANGES: ' +
    results.typeChanges.length
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.typeChanges.length === 0
  ) {

    Logger.log(
      'None'
    );

  }


  results.typeChanges.forEach(function(change) {

    Logger.log(
      '⚠ ' +
      change.key +
      ' | ' +
      change.oldType +
      ' → ' +
      change.newType
    );

  });


  Logger.log(
    ''
  );


  // ==========================================================================
  // Final summary
  // ==========================================================================

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'SUMMARY'
  );

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Known:                ' +
    results.matched.length
  );


  Logger.log(
    'New:                  ' +
    results.newFields.length
  );


  Logger.log(
    'Missing:              ' +
    results.missingFields.length
  );


  Logger.log(
    'Entry IDs changed:    ' +
    results.entryIdChanges.length
  );


  Logger.log(
    'Types changed:        ' +
    results.typeChanges.length
  );


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
      '✔ NO NEW OR MISSING QUESTIONS'
    );

  } else {

    Logger.log(
      '⚠ FORM SCHEMA REQUIRES ATTENTION'
    );

  }


  Logger.log(
    '============================================================'
  );

}


/**
 * ============================================================================
 * TEST: AUTOMATIC NEW FIELD DISCOVERY
 * ============================================================================
 *
 * This test deliberately knows NOTHING about the new question.
 *
 * It simply runs the schema checker and verifies that unaccounted-for
 * questions are discovered.
 *
 * It does NOT require a specific question title.
 *
 * ============================================================================
 */
function testDiscoverNewFormFields() {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'NEW FIELD DISCOVERY TEST'
  );

  Logger.log(
    '============================================================'
  );


  const results =
    checkFormSchema();


  Logger.log(
    ''
  );


  Logger.log(
    'DISCOVERY RESULT'
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    results.newFields.length === 0
  ) {

    Logger.log(
      'No new questions found.'
    );

    Logger.log(
      'Test cannot prove discovery unless the form contains'
    );

    Logger.log(
      'a question that is not already represented in FIELD_SCHEMA.'
    );

    Logger.log(
      '------------------------------------------------------------'
    );

    Logger.log(
      '✔ TEST COMPLETE'
    );

    Logger.log(
      '============================================================'
    );

    return results;

  }


  results.newFields.forEach(function(field, index) {

    Logger.log(
      '✔ DISCOVERED NEW QUESTION #' +
      (index + 1)
    );


    Logger.log(
      '  Title: ' +
      field.title
    );


    Logger.log(
      '  Type: ' +
      field.type
    );


    Logger.log(
      '  Entry ID: ' +
      field.entryId
    );


    Logger.log(
      '  Suggested key: ' +
      field.suggestedKey
    );


    if (
      field.question &&
      field.question.choices
    ) {

      Logger.log(
        '  Choices: ' +
        JSON.stringify(
          field.question.choices
        )
      );

    }

  });


  Logger.log(
    ''
  );


  Logger.log(
    '============================================================'
  );

  Logger.log(
    '✔ NEW FIELD DISCOVERY WORKING'
  );

  Logger.log(
    '============================================================'
  );


  return results;

}


/**
 * ============================================================================
 * RAW GOOGLE FORM DATA TEST
 * ============================================================================
 *
 * Purpose:
 *   Show exactly what Google Forms returns for every item.
 *
 * Read-only.
 *
 * ============================================================================
 */
function testRawFormData() {

  const form =
    getSchemaCheckForm_();


  const items =
    form.getItems();


  Logger.log(
    '============================================================'
  );

  Logger.log(
    'RAW GOOGLE FORM DATA'
  );

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Form title: ' +
    form.getTitle()
  );


  Logger.log(
    'Form ID: ' +
    form.getId()
  );


  Logger.log(
    'Total items: ' +
    items.length
  );


  Logger.log(
    '============================================================'
  );


  items.forEach(function(item, index) {

    const type =
      item.getType();


    const id =
      item.getId();


    let title = '';


    try {

      title =
        item.getTitle();

    } catch (error) {

      title =
        '[NO TITLE METHOD]';

    }


    Logger.log(
      ''
    );


    Logger.log(
      '------------------------------------------------------------'
    );

    Logger.log(
      'ITEM #' +
      (index + 1)
    );

    Logger.log(
      '------------------------------------------------------------'
    );


    Logger.log(
      'Type: ' +
      type
    );


    Logger.log(
      'Type name: ' +
      getRawItemTypeName_(
        type
      )
    );


    Logger.log(
      'Item ID: ' +
      id
    );


    Logger.log(
      'Title: ' +
      JSON.stringify(
        title
      )
    );


    const questionInfo =
      getRawQuestionInfo_(
        item,
        type
      );


    if (questionInfo) {

      Logger.log(
        'IS QUESTION: YES'
      );


      Logger.log(
        'Question data:'
      );


      Logger.log(
        JSON.stringify(
          questionInfo,
          null,
          2
        )
      );

    } else {

      Logger.log(
        'IS QUESTION: NO'
      );

    }

  });


  Logger.log(
    ''
  );


  Logger.log(
    '============================================================'
  );

  Logger.log(
    'RAW FORM TEST COMPLETE'
  );

  Logger.log(
    '============================================================'
  );

}


/**
 * ============================================================================
 * Get readable item type
 * ============================================================================
 */
function getRawItemTypeName_(type) {

  switch (type) {

    case FormApp.ItemType.TEXT:
      return 'TEXT QUESTION';

    case FormApp.ItemType.PARAGRAPH_TEXT:
      return 'PARAGRAPH QUESTION';

    case FormApp.ItemType.MULTIPLE_CHOICE:
      return 'MULTIPLE CHOICE QUESTION';

    case FormApp.ItemType.CHECKBOX:
      return 'CHECKBOX QUESTION';

    case FormApp.ItemType.LIST:
      return 'DROPDOWN QUESTION';

    case FormApp.ItemType.DATE:
      return 'DATE QUESTION';

    case FormApp.ItemType.TIME:
      return 'TIME QUESTION';

    case FormApp.ItemType.DATETIME:
      return 'DATETIME QUESTION';

    case FormApp.ItemType.SCALE:
      return 'SCALE QUESTION';

    case FormApp.ItemType.GRID:
      return 'GRID QUESTION';

    case FormApp.ItemType.CHECKBOX_GRID:
      return 'CHECKBOX GRID QUESTION';

    case FormApp.ItemType.FILE_UPLOAD:
      return 'FILE UPLOAD QUESTION';

    case FormApp.ItemType.SECTION_HEADER:
      return 'SECTION HEADER';

    case FormApp.ItemType.PAGE_BREAK:
      return 'PAGE BREAK';

    case FormApp.ItemType.IMAGE:
      return 'IMAGE';

    case FormApp.ItemType.VIDEO:
      return 'VIDEO';

    case FormApp.ItemType.TITLE:
      return 'FORM TITLE';

    default:
      return 'UNKNOWN';

  }

}


/**
 * ============================================================================
 * Determine whether an item is a question and expose raw question data.
 * ============================================================================
 */
function getRawQuestionInfo_(item, type) {

  switch (type) {

    case FormApp.ItemType.TEXT: {

      const question =
        item.asTextItem();


      return {

        questionType:
          'TEXT',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    case FormApp.ItemType.PARAGRAPH_TEXT: {

      const question =
        item.asParagraphTextItem();


      return {

        questionType:
          'PARAGRAPH_TEXT',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    case FormApp.ItemType.MULTIPLE_CHOICE: {

      const question =
        item.asMultipleChoiceItem();


      return {

        questionType:
          'MULTIPLE_CHOICE',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        choices:
          question
            .getChoices()
            .map(function(choice) {

              return choice.getValue();

            })

      };

    }


    case FormApp.ItemType.CHECKBOX: {

      const question =
        item.asCheckboxItem();


      return {

        questionType:
          'CHECKBOX',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        choices:
          question
            .getChoices()
            .map(function(choice) {

              return choice.getValue();

            })

      };

    }


    case FormApp.ItemType.LIST: {

      const question =
        item.asListItem();


      return {

        questionType:
          'DROPDOWN',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        choices:
          question
            .getChoices()
            .map(function(choice) {

              return choice.getValue();

            })

      };

    }


    case FormApp.ItemType.DATE: {

      const question =
        item.asDateItem();


      return {

        questionType:
          'DATE',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    case FormApp.ItemType.TIME: {

      const question =
        item.asTimeItem();


      return {

        questionType:
          'TIME',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    case FormApp.ItemType.DATETIME: {

      const question =
        item.asDateTimeItem();


      return {

        questionType:
          'DATETIME',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    case FormApp.ItemType.SCALE: {

      const question =
        item.asScaleItem();


      return {

        questionType:
          'SCALE',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        lowerBound:
          question.getLowerBound(),

        upperBound:
          question.getUpperBound(),

        lowerLabel:
          question.getLowerBoundLabel(),

        upperLabel:
          question.getUpperBoundLabel()

      };

    }


    case FormApp.ItemType.GRID: {

      const question =
        item.asGridItem();


      return {

        questionType:
          'GRID',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        rows:
          question.getRows(),

        columns:
          question.getColumns()

      };

    }


    case FormApp.ItemType.CHECKBOX_GRID: {

      const question =
        item.asCheckboxGridItem();


      return {

        questionType:
          'CHECKBOX_GRID',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired(),

        rows:
          question.getRows(),

        columns:
          question.getColumns()

      };

    }


    case FormApp.ItemType.FILE_UPLOAD: {

      const question =
        item.asFileUploadItem();


      return {

        questionType:
          'FILE_UPLOAD',

        helpText:
          question.getHelpText(),

        required:
          question.isRequired()

      };

    }


    default:

      return null;

  }

}


/**
 * ============================================================================
 * PROPOSE UPDATED FIELD_SCHEMA
 * ============================================================================
 *
 * Purpose:
 *   Compare the live Google Form against FIELD_SCHEMA and produce a proposed
 *   updated schema using the LIVE form's Entry IDs and question types.
 *
 * IMPORTANT:
 *   - READ ONLY
 *   - Does NOT modify Google Form
 *   - Does NOT modify FIELD_SCHEMA
 *   - Does NOT modify Script Properties
 *
 * Matching:
 *   Existing fields are matched using the same tolerant matching logic as
 *   checkFormSchema():
 *
 *     1. Exact FIELD_SCHEMA title
 *     2. FIELD_SCHEMA aliases
 *     3. Simplified title matching
 *
 * Entry IDs:
 *   Always use the LIVE Google Form Entry ID in the proposed schema.
 *
 * New questions:
 *   Discovered automatically.
 *
 * Missing questions:
 *   FIELD_SCHEMA fields not represented by a live question.
 *
 * Run:
 *   testProposedFieldSchema()
 *
 * ============================================================================
 */

function testProposedFieldSchema() {

  const form =
    getSchemaCheckForm_();


  const liveItems =
    form.getItems();


  const schema =
    FIELD_SCHEMA;


  // --------------------------------------------------------------------------
  // Build the same lookup used by checkFormSchema()
  // --------------------------------------------------------------------------

  const schemaLookup =
    buildSchemaLookup_(
      schema
    );


  // --------------------------------------------------------------------------
  // Results
  // --------------------------------------------------------------------------

  const proposedSchema = [];

  const newQuestions = [];

  const matchedQuestions = [];

  const missingQuestions = [];

  const foundSchemaKeys = {};


  // --------------------------------------------------------------------------
  // Inspect every live form item
  // --------------------------------------------------------------------------

  liveItems.forEach(function(item) {

    const type =
      item.getType();


    const questionInfo =
      getRawQuestionInfo_(
        item,
        type
      );


    // Ignore section headers, page breaks, images, videos, etc.
    if (!questionInfo) {

      return;

    }


    const liveTitle =
      String(
        item.getTitle() || ''
      ).trim();


    const liveEntryId =
      'entry.' +
      item.getId();


    const liveType =
      getGoogleFormItemType_(
        item
      );


    // ========================================================================
    // IMPORTANT:
    //
    // Use the same tolerant matcher as checkFormSchema().
    // This handles:
    //
    //   Address / Location
    //   Address / Location:
    //
    // and aliases such as the honeypot field.
    // ========================================================================

    const existingField =
      findSchemaFieldForLiveItem_(
        item,
        schemaLookup
      );


    // ========================================================================
    // EXISTING FIELD
    // ========================================================================

    if (existingField) {

      foundSchemaKeys[
        existingField.key
      ] = true;


      // ----------------------------------------------------------------------
      // Clone the existing application configuration.
      //
      // This preserves:
      //   key
      //   formField
      //   aliases
      //   label
      //   section
      //   default
      //
      // Only LIVE Google Form properties are updated below.
      // ----------------------------------------------------------------------

      const updatedField =
        JSON.parse(
          JSON.stringify(
            existingField
          )
        );


      // ----------------------------------------------------------------------
      // Update LIVE form properties
      // ----------------------------------------------------------------------

      updatedField.title =
        liveTitle;


      updatedField.entryId =
        liveEntryId;


      updatedField.type =
        liveType;


      // ----------------------------------------------------------------------
      // Keep the application's existing configuration unchanged.
      // ----------------------------------------------------------------------


      proposedSchema.push(
        updatedField
      );


      matchedQuestions.push({

        key:
          existingField.key,

        title:
          liveTitle,

        oldTitle:
          existingField.title,

        oldEntryId:
          existingField.entryId,

        newEntryId:
          liveEntryId,

        oldType:
          existingField.type,

        newType:
          liveType,

        entryIdChanged:
          String(
            existingField.entryId || ''
          ).trim() !== liveEntryId,

        typeChanged:
          String(
            existingField.type || ''
          ).trim() !== liveType

      });


      return;

    }


    // ========================================================================
    // NEW FIELD
    // ========================================================================

    const suggestedSchema =
      buildSuggestedFieldSchema_(
        item
      );


    // Preserve the raw question information so the proposal contains
    // choices, required status, help text, etc. where available.

    suggestedSchema.question =
      questionInfo;


    proposedSchema.push(
      suggestedSchema
    );


    newQuestions.push({

      title:
        liveTitle,

      entryId:
        liveEntryId,

      type:
        liveType,

      suggestedKey:
        suggestFieldKey_(
          liveTitle
        ),

      suggestedSection:
        suggestFieldSection_(
          liveTitle
        ),

      question:
        questionInfo,

      suggestedSchema:
        suggestedSchema

    });

  });


  // --------------------------------------------------------------------------
  // Find FIELD_SCHEMA fields that are no longer represented in the live form
  // --------------------------------------------------------------------------

  schema.forEach(function(field) {

    if (
      !foundSchemaKeys[field.key]
    ) {

      missingQuestions.push({

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


  // --------------------------------------------------------------------------
  // Calculate change counts
  // --------------------------------------------------------------------------

  const entryIdChanges =
    matchedQuestions.filter(function(field) {

      return field.entryIdChanged;

    });


  const typeChanges =
    matchedQuestions.filter(function(field) {

      return field.typeChanged;

    });


  // ==========================================================================
  // OUTPUT
  // ==========================================================================

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'PROPOSED FIELD_SCHEMA UPDATE'
  );

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Live questions: ' +
    proposedSchema.length
  );


  Logger.log(
    'Existing fields matched: ' +
    matchedQuestions.length
  );


  Logger.log(
    'New fields discovered: ' +
    newQuestions.length
  );


  Logger.log(
    'Missing fields: ' +
    missingQuestions.length
  );


  // --------------------------------------------------------------------------
  // LIVE FIELD CHANGES
  // --------------------------------------------------------------------------

  Logger.log(
    '------------------------------------------------------------'
  );

  Logger.log(
    'LIVE FIELD CHANGES'
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    entryIdChanges.length === 0 &&
    typeChanges.length === 0
  ) {

    Logger.log(
      'None'
    );

  }


  matchedQuestions.forEach(function(field) {

    if (
      !field.entryIdChanged &&
      !field.typeChanged
    ) {

      return;

    }


    Logger.log(
      '⚠ ' +
      field.key
    );


    if (
      field.entryIdChanged
    ) {

      Logger.log(
        '  Entry ID: ' +
        field.oldEntryId +
        ' → ' +
        field.newEntryId
      );

    }


    if (
      field.typeChanged
    ) {

      Logger.log(
        '  Type: ' +
        field.oldType +
        ' → ' +
        field.newType
      );

    }

  });


  // --------------------------------------------------------------------------
  // NEW QUESTIONS
  // --------------------------------------------------------------------------

  Logger.log(
    '------------------------------------------------------------'
  );

  Logger.log(
    'NEW QUESTIONS'
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    newQuestions.length === 0
  ) {

    Logger.log(
      'None'
    );

  } else {

    newQuestions.forEach(function(field) {

      Logger.log(
        '⚠ NEW: ' +
        field.title
      );


      Logger.log(
        '  Suggested key: ' +
        field.suggestedKey
      );


      Logger.log(
        '  Entry ID: ' +
        field.entryId
      );


      Logger.log(
        '  Type: ' +
        field.type
      );


      Logger.log(
        '  Suggested schema:'
      );


      Logger.log(
        JSON.stringify(
          field.suggestedSchema,
          null,
          2
        )
      );


      Logger.log(
        ''
      );

    });

  }


  // --------------------------------------------------------------------------
  // MISSING QUESTIONS
  // --------------------------------------------------------------------------

  Logger.log(
    '------------------------------------------------------------'
  );

  Logger.log(
    'MISSING QUESTIONS'
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  if (
    missingQuestions.length === 0
  ) {

    Logger.log(
      'None'
    );

  } else {

    missingQuestions.forEach(function(field) {

      Logger.log(
        '✖ ' +
        field.key +
        ' | ' +
        field.title +
        ' | ' +
        field.entryId
      );

    });

  }


  // --------------------------------------------------------------------------
  // COMPLETE PROPOSED FIELD_SCHEMA
  // --------------------------------------------------------------------------

  Logger.log(
    '------------------------------------------------------------'
  );

  Logger.log(
    'COMPLETE PROPOSED FIELD_SCHEMA'
  );

  Logger.log(
    '------------------------------------------------------------'
  );


  Logger.log(
    JSON.stringify(
      proposedSchema,
      null,
      2
    )
  );


  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'SUMMARY'
  );

  Logger.log(
    '============================================================'
  );


  Logger.log(
    'Live questions:        ' +
    proposedSchema.length
  );


  Logger.log(
    'Matched:               ' +
    matchedQuestions.length
  );


  Logger.log(
    'New:                   ' +
    newQuestions.length
  );


  Logger.log(
    'Missing:               ' +
    missingQuestions.length
  );


  Logger.log(
    'Entry IDs changed:     ' +
    entryIdChanges.length
  );


  Logger.log(
    'Types changed:         ' +
    typeChanges.length
  );


  Logger.log(
    '============================================================'
  );


  if (
    newQuestions.length === 0 &&
    missingQuestions.length === 0
  ) {

    Logger.log(
      '✔ ALL LIVE QUESTIONS ARE REPRESENTED IN FIELD_SCHEMA'
    );

  } else {

    Logger.log(
      '⚠ FIELD_SCHEMA STILL REQUIRES ATTENTION'
    );

  }


  Logger.log(
    '============================================================'
  );


  Logger.log(
    'PROPOSAL COMPLETE — NOTHING WAS CHANGED'
  );


  Logger.log(
    '============================================================'
  );


  // --------------------------------------------------------------------------
  // Return structured results
  // --------------------------------------------------------------------------

  return {

    proposedSchema:
      proposedSchema,

    matchedQuestions:
      matchedQuestions,

    newQuestions:
      newQuestions,

    missingQuestions:
      missingQuestions,

    entryIdChanges:
      entryIdChanges,

    typeChanges:
      typeChanges

  };

}

