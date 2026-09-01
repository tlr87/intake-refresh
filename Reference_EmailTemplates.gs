function getFieldSchemaForReference() {

  const raw =
    PropertiesService
      .getScriptProperties()
      .getProperty('FIELD_SCHEMA');

  if (!raw) {
    throw new Error(
      'FIELD_SCHEMA does not exist in Script Properties.'
    );
  }

  try {

    return JSON.parse(raw);

  } catch (e) {

    throw new Error(
      'FIELD_SCHEMA contains invalid JSON: ' +
      e.message
    );

  }
}