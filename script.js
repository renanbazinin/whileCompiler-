// Event listener for the Run Program button
document.getElementById('runButton').addEventListener('click', function() {
    const codeInput = document.getElementById('codeInput').value;
    const inputX = document.getElementById('inputX').value;
    const errorDiv = document.getElementById('error');
    const outputDiv = document.getElementById('output');
    const canvas = document.getElementById('treeCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    errorDiv.textContent = '';
    outputDiv.textContent = '';

    try {
        const tokens = tokenize(codeInput);
        const ast = parseProgram(tokens);

        // Parse input variable x
        const inputTokens = tokenizeTreeInput(inputX);
        const inputTree = parseTreeTokens(inputTokens);

        // Initialize variables
        const variables = { x: inputTree };

        // Interpret the program
        interpretProgram(ast, variables);

        // Display output variable y
        if (variables.y !== undefined) {
            outputDiv.innerHTML = '<h3>Output variable y:</h3>';
            const treeNotation = generateTreeNotation(variables.y);
            const listNotation = generateListNotation(variables.y);
            outputDiv.innerHTML += `<p><strong>Tree Notation:</strong> ${treeNotation}</p>`;
            outputDiv.innerHTML += `<p><strong>List Notation:</strong> ${listNotation}</p>`;

            // Draw the output tree
            drawTree(variables.y, canvas);
        } else {
            outputDiv.innerHTML = '<p>No output variable y was produced.</p>';
        }

    } catch (e) {
        errorDiv.textContent = e.message;
        console.error(e);
    }
});

// Event listener for real-time input validation of tree input
document.getElementById('inputX').addEventListener('input', validateTreeInput);

// Real-time input validation function
function validateTreeInput() {
    const inputField = document.getElementById('inputX');
    const input = inputField.value;
    try {
        const tokens = tokenizeTreeInput(input);
        if (isExpressionComplete(tokens)) {
            parseTreeTokens(tokens); // Attempt to parse
            inputField.classList.remove('invalid', 'partial');
            inputField.classList.add('valid');
        } else {
            // Partially complete expression
            inputField.classList.remove('invalid', 'valid');
            inputField.classList.add('partial');
        }
    } catch (e) {
        // Invalid input
        inputField.classList.remove('valid', 'partial');
        inputField.classList.add('invalid');
    }
}

// Function to check if the expression is complete (balanced parentheses)
function isExpressionComplete(tokens) {
    let openParen = 0;
    for (const token of tokens) {
        if (token === '(') openParen++;
        if (token === ')') openParen--;
        if (openParen < 0) return false; // More closing than opening
    }
    return openParen === 0 && tokens.length > 0; // Balanced if zero and not empty
}

// Tokenizer for the While language
function tokenize(input) {
    const regex = /\s*(\bread\b|\bwrite\b|\bwhile\b|\bdo\b|\bend\b|\bif\b|\bthen\b|\belse\b|:=|;|\(|\)|{|}|,|[a-zA-Z_][a-zA-Z0-9_]*|[\+\-\*\/]|!=|==|<=|>=|<|>|[0-9]+)\s*/g;
    const tokens = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        tokens.push(match[1]);
    }
    return tokens;
}

// Parser for the While language
function parseProgram(tokens) {
    let index = 0;

    function parse() {
        const commands = [];
        while (index < tokens.length) {
            const command = parseCommand();
            commands.push(command);
            if (tokens[index] === ';') {
                index++;
            } else {
                break;
            }
        }
        return { type: 'Program', commands: commands };
    }

    function parseCommand() {
        if (tokens[index] === 'read') {
            index++;
            const varName = tokens[index++];
            return { type: 'Read', variable: varName };
        } else if (tokens[index] === 'write') {
            index++;
            const varName = tokens[index++];
            return { type: 'Write', variable: varName };
        } else if (tokens[index] === 'while') {
            index++;
            const condition = parseCondition();
            if (tokens[index] !== 'do') throw new Error("Expected 'do' after while condition");
            index++;
            if (tokens[index] !== '{') throw new Error("Expected '{' to start while body");
            index++; // Skip '{'
            const body = [];
            while (tokens[index] !== '}') {
                body.push(parseCommand());
                if (tokens[index] === ';') index++;
            }
            index++; // Skip '}'
            return { type: 'While', condition: condition, body: body };
        } else if (tokens[index] === 'if') {
            index++;
            const condition = parseCondition();
            if (tokens[index] !== 'then') throw new Error("Expected 'then' after if condition");
            index++;
            if (tokens[index] !== '{') throw new Error("Expected '{' to start then body");
            index++; // Skip '{'
            const thenBody = [];
            while (tokens[index] !== '}') {
                thenBody.push(parseCommand());
                if (tokens[index] === ';') index++;
            }
            index++; // Skip '}'
            let elseBody = [];
            if (tokens[index] === 'else') {
                index++;
                if (tokens[index] !== '{') throw new Error("Expected '{' to start else body");
                index++; // Skip '{'
                while (tokens[index] !== '}') {
                    elseBody.push(parseCommand());
                    if (tokens[index] === ';') index++;
                }
                index++; // Skip '}'
            }
            return { type: 'If', condition: condition, thenBody: thenBody, elseBody: elseBody };
        } else {
            // Assignment
            const varName = tokens[index++];
            if (tokens[index] !== ':=') throw new Error("Expected ':=' in assignment");
            index++;
            const expression = parseExpression();
            return { type: 'Assign', variable: varName, expression: expression };
        }
    }

    function parseCondition() {
        const expr = parseExpression();
        return expr;
    }

    function parseExpression() {
        if (tokens[index] === 'hd' || tokens[index] === 'tl' || tokens[index] === 'succ' || tokens[index] === 'pred') {
            const op = tokens[index++];
            const expr = parseExpression();
            return { type: 'UnaryOp', operator: op, expression: expr };
        } else if (tokens[index] === 'cons') {
            index++;
            if (tokens[index] !== '(') throw new Error("Expected '(' after 'cons'");
            index++;
            const left = parseExpression();
            if (tokens[index] !== ',') throw new Error("Expected ',' in 'cons' expression");
            index++;
            const right = parseExpression();
            if (tokens[index] !== ')') throw new Error("Expected ')' after 'cons' arguments");
            index++;
            return { type: 'Cons', left: left, right: right };
        } else if (tokens[index] === '(') {
            index++;
            const expr = parseExpression();
            if (tokens[index] !== ')') throw new Error("Expected ')' after expression");
            index++;
            return expr;
        } else if (isIdentifier(tokens[index])) {
            const varName = tokens[index++];
            return { type: 'Variable', name: varName };
        } else {
            throw new Error(`Unexpected token '${tokens[index]}' in expression`);
        }
    }

    function isIdentifier(token) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token);
    }

    return parse();
}

// Interpreter for the While language
function interpretProgram(ast, variables) {
    const commands = ast.commands;

    for (const command of commands) {
        interpretCommand(command, variables);
    }
}

function interpretCommand(command, variables) {
    switch (command.type) {
        case 'Read':
            // Input variable x is already read before execution
            break;
        case 'Write':
            // Output will be handled after execution
            break;
        case 'Assign':
            const value = evaluateExpression(command.expression, variables);
            variables[command.variable] = value;
            break;
        case 'While':
            while (evaluateCondition(command.condition, variables)) {
                for (const cmd of command.body) {
                    interpretCommand(cmd, variables);
                }
            }
            break;
        case 'If':
            if (evaluateCondition(command.condition, variables)) {
                for (const cmd of command.thenBody) {
                    interpretCommand(cmd, variables);
                }
            } else {
                for (const cmd of command.elseBody) {
                    interpretCommand(cmd, variables);
                }
            }
            break;
        default:
            throw new Error(`Unknown command type: ${command.type}`);
    }
}

function evaluateCondition(condition, variables) {
    // Conditions are evaluated as true if the result is not 'nil'
    const result = evaluateExpression(condition, variables);
    return result !== null && result.value !== 'nil';
}

function evaluateExpression(expr, variables) {
    switch (expr.type) {
        case 'Variable':
            return variables[expr.name] || { value: 'nil', left: null, right: null };
        case 'UnaryOp':
            const operand = evaluateExpression(expr.expression, variables);
            if (expr.operator === 'hd') {
                return operand.left || { value: 'nil', left: null, right: null };
            } else if (expr.operator === 'tl') {
                return operand.right || { value: 'nil', left: null, right: null };
            } else if (expr.operator === 'succ') {
                // Implement succ: Add one 'nil' to the list
                return {
                    value: '.',
                    left: { value: 'nil', left: null, right: null },
                    right: operand
                };
            } else if (expr.operator === 'pred') {
                // Implement pred: Remove one 'nil' from the list
                if (operand.value === '.' && operand.left.value === 'nil') {
                    return operand.right; // Remove one 'nil' from the front
                } else {
                    // If operand is not a list starting with 'nil', return 'nil'
                    return { value: 'nil', left: null, right: null };
                }
            }           
            
            
            else {
                throw new Error(`Unknown unary operator: ${expr.operator}`);
            }
        case 'Cons':
            const left = evaluateExpression(expr.left, variables);
            const right = evaluateExpression(expr.right, variables);
            return { value: '.', left: left, right: right };
        default:
            throw new Error(`Unknown expression type: ${expr.type}`);
    }
}

// Tokenizer for tree input (accepting dot notation and list notation)
function tokenizeTreeInput(input) {
    const regex = /\s*([()]|\.|[a-zA-Z_][a-zA-Z0-9_]*|nil)\s*/g;
    const tokens = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        tokens.push(match[1]);
    }

    // Check for any invalid characters
    const validTokenRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$|^nil$|^\(|^\)|^\.$/;
    for (let token of tokens) {
        if (!validTokenRegex.test(token)) {
            throw new Error(`Invalid token detected: '${token}'`);
        }
    }
    return tokens;
}

// Parser for tree input (supports dot notation, list notation, and mixed notation)
function parseTreeTokens(tokens) {
    let index = 0;

    function parseExpression() {
        skipWhitespace();

        if (index >= tokens.length) {
            throw new Error('Incomplete expression: expected more tokens.');
        }

        if (tokens[index] === 'nil') {
            index++;
            return { value: 'nil', left: null, right: null };
        } else if (tokens[index] === '(') {
            index++; // Skip '('
            skipWhitespace();

            if (index >= tokens.length) {
                throw new Error('Incomplete expression: expected expression after "(".');
            }

            if (tokens[index] === ')') {
                // Empty list
                index++;
                return { value: 'nil', left: null, right: null };
            }

            let expr = parseSequence();

            if (index >= tokens.length || tokens[index] !== ')') {
                throw new Error("Expected ')' after expression");
            }
            index++; // Skip ')'
            return expr;
        } else if (isIdentifier(tokens[index])) {
            const value = tokens[index++];
            return { value: value, left: null, right: null };
        } else {
            throw new Error(`Unexpected token: '${tokens[index]}' at position ${index}`);
        }
    }

    function parseSequence() {
        skipWhitespace();

        if (index >= tokens.length) {
            throw new Error('Incomplete expression in sequence.');
        }

        let firstExpr = parseExpression();
        skipWhitespace();

        if (index < tokens.length && tokens[index] === '.') {
            // Pair notation
            index++; // Skip '.'
            skipWhitespace();

            if (index >= tokens.length) {
                throw new Error("Incomplete expression: expected expression after '.'.");
            }

            let secondExpr = parseExpression();
            skipWhitespace();
            return { value: '.', left: firstExpr, right: secondExpr };
        } else {
            // List notation or mixed notation
            let elements = [firstExpr];

            while (index < tokens.length && tokens[index] !== ')') {
                let expr = parseExpression();
                skipWhitespace();
                elements.push(expr);
            }

            // Convert the list of elements into nested pairs ending with 'nil'
            let node = { value: 'nil', left: null, right: null }; // Start with 'nil' node as the end of the list

            for (let i = elements.length - 1; i >= 0; i--) {
                node = {
                    value: '.',
                    left: elements[i],
                    right: node
                };
            }

            return node;
        }
    }

    function skipWhitespace() {
        while (index < tokens.length && (tokens[index] === undefined || tokens[index] === '')) {
            index++;
        }
    }

    function isIdentifier(token) {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) || token === 'nil';
    }

    const result = parseExpression();
    skipWhitespace();
    if (index < tokens.length) {
        throw new Error("Unexpected tokens after parsing tree input");
    }
    return result;
}

// Functions to generate tree and list notation
function generateTreeNotation(node) {
    if (node === null || node.value === 'nil') {
        return 'nil';
    } else if (node.left === null && node.right === null) {
        return node.value;
    } else {
        return `(${generateTreeNotation(node.left)} . ${generateTreeNotation(node.right)})`;
    }
}

function generateListNotation(node) {
    function isList(node) {
        return node === null || node.value === 'nil' || (node.value === '.' && isList(node.right));
    }

    if (node === null || node.value === 'nil') {
        return '()';
    } else if (node.left === null && node.right === null) {
        return node.value;
    } else if (isList(node)) {
        let elements = [];
        while (node.value === '.' && node.right !== null) {
            elements.push(generateListNotation(node.left));
            node = node.right;
        }
        if (node.value !== 'nil') {
            // Improper list
            return `(${elements.join(' ')} . ${generateListNotation(node)})`;
        }
        return `(${elements.join(' ')})`;
    } else {
        return `(${generateListNotation(node.left)} . ${generateListNotation(node.right)})`;
    }
}

// Drawing function: Visualizes the tree on the canvas
function drawTree(root, canvas) {
    const context = canvas.getContext('2d');
    const nodeRadius = 20;
    const levelHeight = 80;
    const positions = new Map();
    const nodePositions = [];
    let minX = Infinity;
    let maxX = -Infinity;

    try {
        // Assign positions using in-order traversal
        assignPositions(root);
    } catch (e) {
        console.error("Error during position assignment:", e);
        return;
    }

    // Adjust positions to fit within the canvas
    const totalWidth = maxX - minX + nodeRadius * 2;
    const scale = (canvas.width - nodeRadius * 2) / totalWidth;
    const offsetX = -minX * scale + nodeRadius;

    context.font = '12px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw the tree
    drawNode(root);

    function assignPositions(node, depth = 0) {
        if (node === null) return;

        assignPositions(node.left, depth + 1);

        const x = nodePositions.length * (nodeRadius * 3);
        const y = depth * levelHeight + nodeRadius + 20;
        positions.set(node, { x: x, y: y });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        nodePositions.push(node);

        assignPositions(node.right, depth + 1);
    }

    function drawNode(node) {
        if (node === null) return;

        const pos = positions.get(node);
        const x = pos.x * scale + offsetX;
        const y = pos.y;

        // Draw branches before nodes to have branches behind nodes
        if (node.left) {
            const leftPos = positions.get(node.left);
            const childX = leftPos.x * scale + offsetX;
            const childY = leftPos.y;
            drawBranch(x, y, childX, childY);
            drawNode(node.left);
        }
        if (node.right) {
            const rightPos = positions.get(node.right);
            const childX = rightPos.x * scale + offsetX;
            const childY = rightPos.y;
            drawBranch(x, y, childX, childY);
            drawNode(node.right);
        }

        // Draw node circle
        context.beginPath();
        context.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        context.fillStyle = 'white';
        context.fill();
        context.stroke();

        // Draw label
        context.fillStyle = 'black';
        if (node.value !== '.') {
            context.fillText(node.value, x, y);
        } else {
            context.fillText('.', x, y);
        }
    }

    function drawBranch(x1, y1, x2, y2) {
        context.beginPath();
        context.moveTo(x1, y1 + nodeRadius);
        context.lineTo(x2, y2 - nodeRadius);
        context.strokeStyle = '#888888';
        context.lineWidth = 2;
        context.stroke();
    }
}