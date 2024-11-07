// main.js

document.getElementById('run-button').addEventListener('click', () => {
    const code = document.getElementById('code-editor').value;
    const consoleOutput = document.getElementById('console-output');
    const variableState = document.getElementById('variable-state');

    consoleOutput.textContent = '';
    variableState.innerHTML = '';

    try {
        const context = interpret(code);

        // Display console outputs from write statements
        if (context.__output && context.__output.length > 0) {
            for (const value of context.__output) {
                const outputString = treeToString(value);
                consoleOutput.textContent += outputString + '\n';
            }
        }

        // Display variable states
        for (const varName in context) {
            if (varName.startsWith('__')) continue; // Skip internal properties
            const varContainer = document.createElement('div');
            varContainer.classList.add('variable');

            const varTitle = document.createElement('h3');
            varTitle.textContent = `Variable: ${varName}`;
            varContainer.appendChild(varTitle);

            displayTree(context[varName], varContainer);

            // Also display numeric value if applicable
            const numericValue = treeToNumber(context[varName]);
            const numericDisplay = document.createElement('p');
            numericDisplay.textContent = `Numeric value: ${numericValue}`;
            varContainer.appendChild(numericDisplay);

            variableState.appendChild(varContainer);
        }
    } catch (error) {
        consoleOutput.textContent = `Error: ${error.message}`;
    }
});
