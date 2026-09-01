/**
 * ============================================================================
 * RD3 TECH — EXPORT FIELD_SCHEMA + WORDPRESS MAPPING TO GOOGLE SHEETS
 * ============================================================================
 *
 * Spreadsheet:
 * 1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g
 *
 * Purpose:
 *
 *   Export the live RD3 Tech FIELD_SCHEMA and current WordPress field
 *   mapping into a single Google Sheet reference document.
 *
 * Sections:
 *
 *   1. FIELD_SCHEMA
 *   2. Current WordPress Field Mapping
 *
 * IMPORTANT:
 *
 *   FIELD_SCHEMA is the source of truth.
 *
 *   The Spreadsheet ID remains server-side.
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 */

const FIELD_SCHEMA_SHEETS_CONFIG = {

  spreadsheetId:
    '1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g',

  sheetName:
    'FIELD_SCHEMA'

};


/**
 * ============================================================================
 * CURRENT WORDPRESS FIELD MAPPING
 * ============================================================================
 *
 * This represents the current WordPress HTML structure.
 *
 * FIELD_SCHEMA Key is NOT treated as an independent source of truth.
 *
 * It is resolved against FIELD_SCHEMA when the export runs.
 *
 * ============================================================================
 */

const WORDPRESS_FIELD_MAPPING = [

  {
    htmlId: 'rd3-input-name',
    postParameter: 'name',
    purpose: 'Client name'
  },

  {
    htmlId: 'rd3-input-email',
    postParameter: 'email',
    purpose: 'Client email address'
  },

  {
    htmlId: 'rd3-input-phone',
    postParameter: 'phone',
    purpose: 'Client phone number'
  },

  {
    htmlId: 'rd3-input-pref',
    postParameter: 'preferredContact',
    purpose: 'Preferred contact method'
  },

  {
    htmlId: 'rd3-input-used',
    postParameter: 'usedBefore',
    purpose: 'Previous RD3 Tech client'
  },

  {
    htmlId: 'rd3-input-clienttype',
    postParameter: 'contactingAs',
    purpose: 'Client type'
  },

  {
    htmlId: 'rd3-input-location',
    postParameter: 'location',
    purpose: 'Address / location'
  },

  {
    htmlId: 'rd3-input-category',
    postParameter: 'helpCategory',
    purpose: 'Help category'
  },

  {
    htmlId: 'rd3-input-goal',
    postParameter: 'userGoal',
    purpose: 'Desired outcome'
  },

  {
    htmlId: 'rd3-input-urgency',
    postParameter: 'urgency',
    purpose: 'Urgency level'
  }

];


/**
 * ============================================================================
 * MAIN EXPORT
 * ============================================================================
 *
 * Run directly from Apps Script:
 *
 *     exportToSheets()
 *
 * Or from Index.html:
 *
 *     google.script.run.exportToSheets()
 *
 * ============================================================================
 */

function exportToSheets() {

  try {

    /*
     * ------------------------------------------------------------
     * Load live FIELD_SCHEMA.
     * ------------------------------------------------------------
     */

    const fieldSchema =
      getExportFieldSchema_();


    if (
      !fieldSchema ||
      typeof fieldSchema !== 'object'
    ) {

      throw new Error(
        'FIELD_SCHEMA could not be loaded.'
      );

    }


    /*
     * ------------------------------------------------------------
     * Normalise FIELD_SCHEMA.
     * ------------------------------------------------------------
     */

    const fields =
      normaliseFieldSchemaForSheets_(
        fieldSchema
      );


    if (!fields.length) {

      throw new Error(
        'FIELD_SCHEMA contains no fields to export.'
      );

    }


    /*
     * ------------------------------------------------------------
     * Open spreadsheet.
     * ------------------------------------------------------------
     */

    const ss =
      SpreadsheetApp.openById(
        FIELD_SCHEMA_SHEETS_CONFIG.spreadsheetId
      );


    if (!ss) {

      throw new Error(
        'The configured spreadsheet could not be opened.'
      );

    }


    /*
     * ------------------------------------------------------------
     * Get or create sheet.
     * ------------------------------------------------------------
     */

    let sheet =
      ss.getSheetByName(
        FIELD_SCHEMA_SHEETS_CONFIG.sheetName
      );


    if (!sheet) {

      sheet =
        ss.insertSheet(
          FIELD_SCHEMA_SHEETS_CONFIG.sheetName
        );

    }


    /*
     * ------------------------------------------------------------
     * Clear previous export.
     * ------------------------------------------------------------
     */

    sheet.clear();


    /*
     * ------------------------------------------------------------
     * Export FIELD_SCHEMA section.
     * ------------------------------------------------------------
 */

    let currentRow = 1;


    sheet
      .getRange(
        currentRow,
        1
      )
      .setValue(
        'FIELD_SCHEMA'
      );


    sheet
      .getRange(
        currentRow,
        1
      )
      .setFontWeight(
        'bold'
      );


    currentRow += 1;


    const schemaHeaders = [

      '#',

      'Question Title',

      'Entry ID',

      'Schema Key',

      'Data Type',

      'HTML Template Tag'

    ];


    sheet
      .getRange(
        currentRow,
        1,
        1,
        schemaHeaders.length
      )
      .setValues([
        schemaHeaders
      ]);


    sheet
      .getRange(
        currentRow,
        1,
        1,
        schemaHeaders.length
      )
      .setFontWeight(
        'bold'
      );


    currentRow += 1;


    const schemaRows =
      fields.map(function(field, index) {

        const schemaKey =
          getSchemaKeyForSheets_(
            field
          );


        const questionTitle =
          getQuestionTitleForSheets_(
            field
          );


        const entryId =
          field.entryId ||
          '';


        const dataType =
          field.type ||
          field.dataType ||
          '';


        const htmlTemplateTag =
          schemaKey
            ? '<?= request.' +
              schemaKey +
              ' ?>'
            : '';


        return [

          index + 1,

          questionTitle,

          entryId,

          schemaKey,

          dataType,

          htmlTemplateTag

        ];

      });


    if (schemaRows.length) {

      sheet
        .getRange(
          currentRow,
          1,
          schemaRows.length,
          schemaHeaders.length
        )
        .setValues(
          schemaRows
        );

      currentRow +=
        schemaRows.length;

    }


    /*
     * ------------------------------------------------------------
     * Blank row between sections.
     * ------------------------------------------------------------
     */

    currentRow += 2;


    /*
     * ------------------------------------------------------------
     * WordPress mapping section.
     * ------------------------------------------------------------
 */

    sheet
      .getRange(
        currentRow,
        1
      )
      .setValue(
        'Current WordPress Field Mapping'
      );


    sheet
      .getRange(
        currentRow,
        1
      )
      .setFontWeight(
        'bold'
      );


    currentRow += 1;


    const wordpressHeaders = [

      '#',

      'WordPress HTML ID',

      'POST Parameter',

      'FIELD_SCHEMA Key',

      'Purpose'

    ];


    sheet
      .getRange(
        currentRow,
        1,
        1,
        wordpressHeaders.length
      )
      .setValues([
        wordpressHeaders
      ]);


    sheet
      .getRange(
        currentRow,
        1,
        1,
        wordpressHeaders.length
      )
      .setFontWeight(
        'bold'
      );


    currentRow += 1;


    /*
     * ------------------------------------------------------------
     * Build WordPress mapping.
     * ------------------------------------------------------------
 */

    const wordpressRows =
      WORDPRESS_FIELD_MAPPING.map(
        function(mapping, index) {

          const matchedField =
            findFieldSchemaMatch_(
              mapping.postParameter,
              fields
            );


          const schemaKey =
            matchedField
              ? getSchemaKeyForSheets_(
                  matchedField
                )
              : 'NOT FOUND';


          return [

            index + 1,

            mapping.htmlId,

            mapping.postParameter,

            schemaKey,

            mapping.purpose

          ];

        }
      );


    if (wordpressRows.length) {

      sheet
        .getRange(
          currentRow,
          1,
          wordpressRows.length,
          wordpressHeaders.length
        )
        .setValues(
          wordpressRows
        );

    }


    /*
     * ------------------------------------------------------------
     * Formatting.
     * ------------------------------------------------------------
 */

    sheet.setFrozenRows(0);


    sheet.autoResizeColumns(
      1,
      6
    );


    /*
     * Give the HTML Template Tag column enough room.
     */

    sheet.setColumnWidth(
      6,
      260
    );


    /*
     * Wrap long values.
     */

    sheet
      .getDataRange()
      .setWrapStrategy(
        SpreadsheetApp.WrapStrategy.WRAP
      );


    /*
     * ------------------------------------------------------------
     * Return result.
     * ------------------------------------------------------------
 */

    return {

      success: true,

      message:
        'FIELD_SCHEMA and WordPress mapping exported successfully.',

      sheet:
        FIELD_SCHEMA_SHEETS_CONFIG.sheetName,

      fieldCount:
        fields.length,

      wordpressMappingCount:
        WORDPRESS_FIELD_MAPPING.length

    };

  } catch (error) {

    console.error(
      'exportToSheets failed:',
      error
    );


    throw new Error(
      error &&
      error.message
        ? error.message
        : 'Unable to export FIELD_SCHEMA to Google Sheets.'
    );

  }

}


/**
 * ============================================================================
 * GET FIELD_SCHEMA
 * ============================================================================
 */

function getExportFieldSchema_() {

  /*
   * Existing project provider.
   */

  if (
    typeof getFieldSchema === 'function'
  ) {

    const schema =
      getFieldSchema();


    if (
      schema &&
      typeof schema === 'object'
    ) {

      return schema;

    }

  }


  /*
   * Global FIELD_SCHEMA.
   */

  if (
    typeof FIELD_SCHEMA !== 'undefined' &&
    FIELD_SCHEMA
  ) {

    return FIELD_SCHEMA;

  }


  /*
   * Script Properties.
   */

  const storedSchema =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'FIELD_SCHEMA'
      );


  if (storedSchema) {

    try {

      return JSON.parse(
        storedSchema
      );

    } catch (error) {

      throw new Error(
        'FIELD_SCHEMA in Script Properties contains invalid JSON.'
      );

    }

  }


  /*
   * Fallback provider.
   */

  if (
    typeof getFallbackFieldSchema === 'function'
  ) {

    const fallback =
      getFallbackFieldSchema();


    if (
      fallback &&
      typeof fallback === 'object'
    ) {

      return fallback;

    }

  }


  throw new Error(
    'Unable to load FIELD_SCHEMA.'
  );

}


/**
 * ============================================================================
 * NORMALISE FIELD_SCHEMA
 * ============================================================================
 */

function normaliseFieldSchemaForSheets_(
  fieldSchema
) {

  let fields = [];


  /*
   * Array.
   */

  if (
    Array.isArray(fieldSchema)
  ) {

    fields =
      fieldSchema.slice();

  }


  /*
   * Object.
   */

  else {

    fields =
      Object.keys(fieldSchema)
        .map(function(key) {

          const field =
            fieldSchema[key];


          if (
            !field ||
            typeof field !== 'object'
          ) {

            return null;

          }


          /*
           * Preserve object key if key is missing.
           */

          if (!field.key) {

            field.key =
              key;

          }


          return field;

        })
        .filter(function(field) {

          return field !== null;

        });

  }


  /*
   * Explicit order/index support.
   */

  const hasExplicitOrder =
    fields.some(function(field) {

      return (
        field.order !== undefined ||
        field.index !== undefined
      );

    });


  if (hasExplicitOrder) {

    fields.sort(function(a, b) {

      const orderA =
        a.order !== undefined
          ? Number(a.order)
          : a.index !== undefined
            ? Number(a.index)
            : 999999;


      const orderB =
        b.order !== undefined
          ? Number(b.order)
          : b.index !== undefined
            ? Number(b.index)
            : 999999;


      return orderA - orderB;

    });

  }


  return fields;

}


/**
 * ============================================================================
 * GET SCHEMA KEY
 * ============================================================================
 */

function getSchemaKeyForSheets_(
  field
) {

  return String(

    field.key ||

    field.schemaKey ||

    field.formField ||

    ''

  );

}


/**
 * ============================================================================
 * GET QUESTION TITLE
 * ============================================================================
 */

function getQuestionTitleForSheets_(
  field
) {

  return String(

    field.title ||

    field.label ||

    field.questionTitle ||

    field.question ||

    field.formField ||

    ''

  );

}


/**
 * ============================================================================
 * FIND FIELD_SCHEMA MATCH
 * ============================================================================
 *
 * Matching order:
 *
 *   1. Exact schema key
 *   2. formField
 *   3. aliases
 *
 * Example:
 *
 *   POST parameter:
 *
 *       preferredContact
 *
 *   FIELD_SCHEMA:
 *
 *       key: 'preferredContact'
 *
 *   Result:
 *
 *       preferredContact
 *
 * ============================================================================
 */

function findFieldSchemaMatch_(
  postParameter,
  fields
) {

  if (!postParameter) {

    return null;

  }


  const target =
    String(
      postParameter
    )
    .trim()
    .toLowerCase();


  /*
   * ------------------------------------------------------------
   * Exact schema key.
   * ------------------------------------------------------------
 */

  for (
    let i = 0;
    i < fields.length;
    i++
  ) {

    const field =
      fields[i];


    if (
      field.key &&
      String(field.key)
        .trim()
        .toLowerCase() === target
    ) {

      return field;

    }

  }


  /*
   * ------------------------------------------------------------
   * formField.
   * ------------------------------------------------------------
 */

  for (
    let i = 0;
    i < fields.length;
    i++
  ) {

    const field =
      fields[i];


    if (
      field.formField &&
      String(field.formField)
        .trim()
        .toLowerCase() === target
    ) {

      return field;

    }

  }


  /*
   * ------------------------------------------------------------
   * aliases.
   * ------------------------------------------------------------
 */

  for (
    let i = 0;
    i < fields.length;
    i++
  ) {

    const field =
      fields[i];


    if (
      !Array.isArray(
        field.aliases
      )
    ) {

      continue;

    }


    for (
      let j = 0;
      j < field.aliases.length;
      j++
    ) {

      const alias =
        String(
          field.aliases[j]
        )
        .trim()
        .toLowerCase();


      if (
        alias === target
      ) {

        return field;

      }

    }

  }


  return null;

}


/**
 * ============================================================================
 * TEST
 * ============================================================================
 *
 * Run:
 *
 *     testExportToSheets()
 *
 * ============================================================================
 */

function testExportToSheets() {

  const result =
    exportToSheets();


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}