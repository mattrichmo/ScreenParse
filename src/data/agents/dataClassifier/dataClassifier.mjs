
export const CreateDataClassifier = async (scene) => {

        let DataClassifier = {}

        let sceneText = scene.sceneCleanText;
        let sceneHeader = scene.sceneHeader;



        DataClassifier.systemPrompt = `You are an element classifier. You choose the best fit classification from a given list for a certain element. You will be provided with the element as the object parent and elementClass as the value to be returned by you.
        Only use the provided classification category options given to you. Choose the absolute best option if you need to.
        
        These are the elements that we are classifying: 
        <START ELEMENT NAMES>
        ${elementString}
        <END ELEMENT NAMES>
        <START CLASSIFICATION CATEGORY OPTIONS>
        ${validCategories}
        <END CLASSIFICATION CATEGORY OPTIONS>  `;

        DataClassifier.userPrompt = `Here is the scene for context: <START CONTEXT>${sceneHeader}\\${sceneText}<END CONTEXT>.
        Please classify each element based on these following classification category options:
        <START CLASSIFICATION CATEGORY OPTIONS> ${validCategories} <END CLASSIFICATION CATEGORY OPTIONS>`;


        return DataClassifier

}