/**
 * ============================================================================
 * FieldSchemaTests.gs
 * ============================================================================
 *
 * Tests the FIELD_SCHEMA single-source-of-truth architecture.
 *
 * These tests:
 *
 *   - DO NOT modify the Google Form
 *   - DO NOT modify Script Properties
 *   - DO NOT modify Automation.gs
 *   - DO NOT permanently modify FIELD_SCHEMA
 *
 * Run:
 *
 *     runFieldSchemaTests()
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * Master test runner
 * ============================================================================
 */
function runFieldSchemaTests() {

  const tests = [

    testFieldSchemaExists,

    testFieldSchemaHasRequiredProperties,

    testFieldSchemaKeysAreUnique,

    testFieldSchemaEntryIdsAreUnique,

    testFieldSchemaNoEntryIdsInAliases,

    testFallbackFormConfigContainsSettingsOnly,

    testMappingUsesFieldSchema,

    testKnownFieldsMapCorrectly

  ];


  let passed = 0;

  let failed = 0;


  Logger.log(
    '============================================================'
  );

  Logger.log(
    'FIELD_SCHEMA TEST SUITE'
  );

  Logger.log(
    '============================================================'
  );


  tests.forEach(function(test) {

    try {

      test();

      passed++;


      Logger.log(
        '✔ PASS: ' +
        test.name
      );


    } catch (err) {

      failed++;


      Logger.log(

        '✖ FAIL: ' +
        test.name +
        ' — ' +
        err.message

      );

    }

  });


  Logger.log(
    '============================================================'
  );


  Logger.log(

    'RESULT: ' +
    passed +
    ' passed, ' +
    failed +
    ' failed'

  );


  Logger.log(
    '============================================================'
  );


  if (failed > 0) {

    throw new Error(

      'FIELD_SCHEMA tests failed: ' +
      failed

    );

  }


  Logger.log(
    '✔ ALL FIELD_SCHEMA TESTS PASSED'
  );

}


/**
 * ============================================================================
 * Assertion helper
 * ============================================================================
 */
function assertFieldSchemaTest(
  condition,
  message
) {

  if (!condition) {

    throw new Error(
      message
    );

  }

}


/**
 * ============================================================================
 * FIELD_SCHEMA exists and is an array
 * ============================================================================
 */
function testFieldSchemaExists() {

  assertFieldSchemaTest(

    typeof FIELD_SCHEMA !== 'undefined',

    'FIELD_SCHEMA is not defined.'

  );


  assertFieldSchemaTest(

    Array.isArray(FIELD_SCHEMA),

    'FIELD_SCHEMA must be an array.'

  );


  assertFieldSchemaTest(

    FIELD_SCHEMA.length > 0,

    'FIELD_SCHEMA is empty.'

  );

}


/**
 * ============================================================================
 * Every field has the consolidated structure
 * ============================================================================
 */
function testFieldSchemaHasRequiredProperties() {

  FIELD_SCHEMA.forEach(
    function(field, index) {


      assertFieldSchemaTest(

        !!field.key,

        'Field #' +
        index +
        ' is missing key.'

      );


      assertFieldSchemaTest(

        !!field.formField,

        'Field [' +
        field.key +
        '] is missing formField.'

      );


      assertFieldSchemaTest(

        !!field.title,

        'Field [' +
        field.key +
        '] is missing title.'

      );


      assertFieldSchemaTest(

        !!field.entryId,

        'Field [' +
        field.key +
        '] is missing entryId.'

      );


      assertFieldSchemaTest(

        !!field.type,

        'Field [' +
        field.key +
        '] is missing type.'

      );


      assertFieldSchemaTest(

        !!field.label,

        'Field [' +
        field.key +
        '] is missing label.'

      );


      assertFieldSchemaTest(

        !!field.section,

        'Field [' +
        field.key +
        '] is missing section.'

      );


      assertFieldSchemaTest(

        Object.prototype.hasOwnProperty.call(
          field,
          'default'
        ),

        'Field [' +
        field.key +
        '] is missing default.'

      );

    }
  );

}


/**
 * ============================================================================
 * Application keys must be unique
 * ============================================================================
 */
function testFieldSchemaKeysAreUnique() {

  const seen = {};


  FIELD_SCHEMA.forEach(
    function(field) {

      assertFieldSchemaTest(

        !seen[field.key],

        'Duplicate FIELD_SCHEMA key: ' +
        field.key

      );


      seen[field.key] =
        true;

    }
  );

}


/**
 * ============================================================================
 * Entry IDs must be unique
 * ============================================================================
 */
function testFieldSchemaEntryIdsAreUnique() {

  const seen = {};


  FIELD_SCHEMA.forEach(
    function(field) {

      assertFieldSchemaTest(

        !seen[field.entryId],

        'Duplicate entryId: ' +
        field.entryId

      );


      seen[field.entryId] =
        true;

    }
  );

}


/**
 * ============================================================================
 * Entry IDs should have their own property
 * ============================================================================
 */
function testFieldSchemaNoEntryIdsInAliases() {

  FIELD_SCHEMA.forEach(
    function(field) {

      const aliases =
        Array.isArray(field.aliases)
          ? field.aliases
          : [];


      assertFieldSchemaTest(

        aliases.indexOf(
          field.entryId
        ) === -1,

        'Field [' +
        field.key +
        '] still contains entryId inside aliases.'

      );

    }
  );

}


/**
 * ============================================================================
 * Prove mapFormPayload uses FIELD_SCHEMA
 * ============================================================================
 *
 * We temporarily add a synthetic field.
 *
 * If mapFormPayload() sees that field and maps it correctly,
 * we have direct proof that the mapper is driven by FIELD_SCHEMA.
 *
 * The synthetic field is removed immediately afterwards.
 * ============================================================================
 */
function testMappingUsesFieldSchema() {

  const originalLength =
    FIELD_SCHEMA.length;


  const testField = {

    key:
      '__fieldSchemaTest',

    formField:
      'form___fieldSchemaTest',

    title:
      '__FIELD_SCHEMA_TEST__',

    entryId:
      'entry.__FIELD_SCHEMA_TEST__',

    type:
      'text',

    aliases: [

      '__field_schema_test_alias__'

    ],

    label:
      'FIELD_SCHEMA Test',

    section:
      'request',

    default:
      'DEFAULT_TEST_VALUE'

  };


  try {

    FIELD_SCHEMA.push(
      testField
    );


    const result =
      mapFormPayload({

        '__field_schema_test_alias__':
          'WORKED'

      });


    assertFieldSchemaTest(

      result &&
      result.payload &&
      result.payload.request &&
      result.payload.request.__fieldSchemaTest ===
        'WORKED',

      'mapFormPayload did not map the synthetic FIELD_SCHEMA field.'

    );


  } finally {

    FIELD_SCHEMA.length =
      originalLength;

  }

}


/**
 * ============================================================================
 * Verify real fields still map correctly
 * ============================================================================
 */
function testKnownFieldsMapCorrectly() {

  const result =
    mapFormPayload({

      'Name':
        'Schema Test Name',

      'Email':
        'schema-test@example.com',

      'Phone':
        '021 TEST',

      'What Are You Trying To Achieve?':
        'FIELD_SCHEMA TEST'

    });


  assertFieldSchemaTest(

    result.payload.client.name ===
      'Schema Test Name',

    'Name did not map correctly.'

  );


  assertFieldSchemaTest(

    result.payload.client.email ===
      'schema-test@example.com',

    'Email did not map correctly.'

  );


  assertFieldSchemaTest(

    result.payload.client.phone ===
      '021 TEST',

    'Phone did not map correctly.'

  );


  assertFieldSchemaTest(

    result.payload.request.userGoal ===
      'FIELD_SCHEMA TEST',

    'userGoal did not map correctly.'

  );

}


/**
 * ============================================================================
 * FORM_CONFIG must now contain settings only
 * ============================================================================
 */
function testFallbackFormConfigContainsSettingsOnly() {

  const config =
    getFallbackFormConfig();


  assertFieldSchemaTest(

    config &&
    config.settings,

    'Fallback FORM_CONFIG is missing settings.'

  );


  assertFieldSchemaTest(

    !config.fields,

    'Fallback FORM_CONFIG still contains fields. Field definitions must live in FIELD_SCHEMA.'

  );


  assertFieldSchemaTest(

    !!config.settings.adminEmail,

    'FORM_CONFIG settings missing adminEmail.'

  );


  assertFieldSchemaTest(

    !!config.settings.formTitle,

    'FORM_CONFIG settings missing formTitle.'

  );


  assertFieldSchemaTest(

    !!config.settings.formBaseUrl,

    'FORM_CONFIG settings missing formBaseUrl.'

  );

}