/**
 * Generates pre-filled Google Form URLs dynamically based on current item types.
 */
function generatePreFilledUrl() {
  const form = FormApp.getActiveForm();
  const formResponse = form.createResponse();
  const items = form.getItems();
  const formConfig = getFormConfig();

  items.forEach(item => {
    const title = item.getTitle();
    const type = item.getType();
    let answer = null;

    if (title.includes(formConfig.fields.name.titleMatch)) answer = 'Tom Revill';
    else if (title.includes(formConfig.fields.email.titleMatch)) answer = 'tom.revill@gmail.com';
    else if (title.includes(formConfig.fields.phone.titleMatch)) answer = '022 555 554';
    else if (title.includes(formConfig.fields.contactPreference.titleMatch)) answer = 'Email';
    else if (title.includes(formConfig.fields.usedBefore.titleMatch)) answer = 'Yes';
    else if (title.includes(formConfig.fields.clientType.titleMatch)) answer = 'Home or Family';
    else if (title.includes(formConfig.fields.helpCategory.titleMatch)) answer = ['Help with Something Broken?'];
    else if (title.includes(formConfig.fields.userGoal.titleMatch)) answer = 'TV is broken';
    else if (title.includes(formConfig.fields.urgency.titleMatch)) answer = 'High';

    if (answer !== null) {
      try {
        if (type === FormApp.ItemType.TEXT) {
          formResponse.withItemResponse(item.asTextItem().createResponse(answer));
        } else if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
          formResponse.withItemResponse(item.asParagraphTextItem().createResponse(answer));
        } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
          formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(answer));
        } else if (type === FormApp.ItemType.LIST) {
          formResponse.withItemResponse(item.asListItem().createResponse(answer));
        } else if (type === FormApp.ItemType.CHECKBOX) {
          const checkAnswers = Array.isArray(answer) ? answer : [answer];
          formResponse.withItemResponse(item.asCheckboxItem().createResponse(checkAnswers));
        }
      } catch (err) {
        Logger.log('Could not pre-fill item "' + title + '": ' + err.message);
      }
    }
  });

  const preFilledUrl = formResponse.toPrefilledUrl();
  
  Logger.log('==================================================');
  Logger.log('GENERATED PRE-FILLED URL:');
  Logger.log(preFilledUrl);
  Logger.log('==================================================');
}