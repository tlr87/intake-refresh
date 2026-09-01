/**
 * ============================================================================
 * RD3 TECH — DIRECT REFERENCE TEMPLATE DIAGNOSTIC
 * ============================================================================
 *
 * PURPOSE:
 *
 * Tests ReferenceTemplate.html directly.
 *
 * This intentionally bypasses doGet() and authorisation so that we can
 * determine whether the actual HTML file can be evaluated.
 *
 * Run:
 *
 *   testReferenceTemplateDirect
 *
 * ============================================================================
 */
function testReferenceTemplateDirect() {

  Logger.log('============================================');
  Logger.log('RD3 TECH — DIRECT TEMPLATE DIAGNOSTIC');
  Logger.log('============================================');


  var template;


  /**
   * --------------------------------------------------------------------------
   * STEP 1 — LOAD FILE
   * --------------------------------------------------------------------------
   */
  try {

    Logger.log('');
    Logger.log('STEP 1 — Loading ReferenceTemplate.html');


    template =
      HtmlService.createTemplateFromFile(
        'ReferenceTemplate'
      );


    Logger.log(
      'PASS: ReferenceTemplate.html loaded.'
    );


  } catch (err) {

    Logger.log(
      'FAIL: Could not load ReferenceTemplate.html.'
    );


    Logger.log(
      'ERROR: ' +
      getErrorMessage_(err)
    );


    return;

  }


  /**
   * --------------------------------------------------------------------------
   * STEP 2 — LOAD FIELD_SCHEMA
   * --------------------------------------------------------------------------
   */
  try {

    Logger.log('');
    Logger.log('STEP 2 — Loading FIELD_SCHEMA');


    var fieldSchema =
      getReferenceFieldSchema_();


    if (
      !fieldSchema ||
      typeof fieldSchema !== 'object'
    ) {

      throw new Error(
        'FIELD_SCHEMA is missing or invalid.'
      );

    }


    Logger.log(
      'PASS: FIELD_SCHEMA loaded.'
    );


    Logger.log(
      'Field count: ' +
      (
        Array.isArray(fieldSchema)
          ? fieldSchema.length
          : Object.keys(fieldSchema).length
      )
    );


  } catch (err) {

    Logger.log(
      'FAIL: FIELD_SCHEMA could not be loaded.'
    );


    Logger.log(
      'ERROR: ' +
      getErrorMessage_(err)
    );


    return;

  }


  /**
   * --------------------------------------------------------------------------
   * STEP 3 — PASS TEMPLATE VARIABLES
   * --------------------------------------------------------------------------
   */
  try {

    Logger.log('');
    Logger.log('STEP 3 — Passing template variables');


    template.fieldSchemaJson =
      JSON.stringify(
        fieldSchema
      );


    template.initialFieldSchemaJson =
      JSON.stringify(
        fieldSchema
      );


    template.webAppUrl =
      getWebAppUrl_();


    Logger.log(
      'PASS: Template variables assigned.'
    );


  } catch (err) {

    Logger.log(
      'FAIL: Could not assign template variables.'
    );


    Logger.log(
      'ERROR: ' +
      getErrorMessage_(err)
    );


    return;

  }


  /**
   * --------------------------------------------------------------------------
   * STEP 4 — EVALUATE HTML
   * --------------------------------------------------------------------------
   *
   * THIS IS THE IMPORTANT TEST.
   *
   * If "Invalid or unexpected token" occurs here, the problem is inside
   * ReferenceTemplate.html.
   * --------------------------------------------------------------------------
   */
  try {

    Logger.log('');
    Logger.log('STEP 4 — Evaluating ReferenceTemplate.html');


    var output =
      template.evaluate();


    if (!output) {

      throw new Error(
        'template.evaluate() returned no output.'
      );

    }


    Logger.log(
      'PASS: ReferenceTemplate.html evaluated successfully.'
    );


    Logger.log(
      'Title: ' +
      output.getTitle()
    );


    var html =
      output.getContent();


    Logger.log(
      'Rendered HTML length: ' +
      html.length
    );


  } catch (err) {

    Logger.log('');
    Logger.log(
      'FAIL: ReferenceTemplate.html contains an evaluation error.'
    );


    Logger.log(
      'ERROR: ' +
      getErrorMessage_(err)
    );


    Logger.log('');
    Logger.log(
      'IMPORTANT:'
    );


    Logger.log(
      'The router and FIELD_SCHEMA are NOT the cause of this failure.'
    );


    Logger.log(
      'The problem is inside ReferenceTemplate.html.'
    );


    return;

  }


  /**
   * --------------------------------------------------------------------------
   * COMPLETE
   * --------------------------------------------------------------------------
   */
  Logger.log('');
  Logger.log('============================================');
  Logger.log('PASS: REFERENCE TEMPLATE IS FUNCTIONAL');
  Logger.log('============================================');

}