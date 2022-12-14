const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if (result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey);
            }
        });
    });
};

const generate = async (prompt) => {
    // Get API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    // Call completions endpoint
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 1250,
            temperature: 0.8,
        }),
    });

    // Select the top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
    try {
        const { selectionText } = info;
        const basePromptPrefix = `
            Write four very short headings for a company's blog post describing its product.
    
            The company  
        `

        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`)

        const secondPrompt = `
            Take the Headings and Company Description and generate the html for a website. Do not include a style element or CSS.  The company's website should have a mobile-first design style and is similar in style to Tesla's website. The website should be minimalistic but include places for images to be included. It needs to have a header with a nav element, two sections, and a footer. Each section should contain two subheadings. Each subheading should have two paragraph elements in each of them.

            Headings: ${baseCompletion.text}

            Company Description: ${selectionText}
        `
        const secondPromptCompletion = await generate(secondPrompt);
        console.log(secondPromptCompletion.text)
    } catch (error) {
        console.log(error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'context-run',
        title: 'Generate quick html',
        contexts: ['selection'],
    });
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);