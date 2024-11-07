// WhileInterpreter.js

// The main interpreter function
function interpret(code) {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const context = {};
    context.__output = []; // For storing outputs from write statements
    execute(ast, context);
    return context;
}

// Tokenizer function that returns tokens with line numbers
function tokenize(code) {
    const tokens = [];
    const lines = code.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
        lineNumber++;
        let index = 0;
        const lineLength = line.length;

        while (index < lineLength) {
            const char = line[index];

            // Skip whitespace
            if (/\s/.test(char)) {
                index++;
                continue;
            }

            // Skip comments
            if (char === '/' && line[index + 1] === '/') {
                // Skip the rest of the line
                break;
            }

            // Match operators and punctuation
            const twoCharOp = line.substr(index, 2);
            if (twoCharOp === ':=') {
                tokens.push({ type: 'ASSIGN_OP', value: ':=', lineNumber, lineContent: line.trim() });
                index += 2;
                continue;
            }

            if (';(){}+-,.'.includes(char)) {
                tokens.push({ type: 'PUNCTUATION', value: char, lineNumber, lineContent: line.trim() });
                index++;
                continue;
            }

            // Numbers
            if (/\d/.test(char)) {
                let num = '';
                while (index < lineLength && /\d/.test(line[index])) {
                    num += line[index];
                    index++;
                }
                tokens.push({ type: 'NUMBER', value: parseInt(num, 10), lineNumber, lineContent: line.trim() });
                continue;
            }

            // Identifiers (variables and function names)
            if (/[a-zA-Z_]/.test(char)) {
                let id = '';
                while (index < lineLength && /[a-zA-Z_0-9]/.test(line[index])) {
                    id += line[index];
                    index++;
                }
                tokens.push({ type: 'IDENTIFIER', value: id, lineNumber, lineContent: line.trim() });
                continue;
            }

            throw new Error(`Unknown character '${char}' at line ${lineNumber}`);
        }
    }

    return tokens;
}

// Parser for While Lang
function parse(tokens) {
    const commands = [];
    while (tokens.length > 0) {
        commands.push(parseCommand(tokens));
    }
    return commands;
}

function parseCommand(tokens) {
    if (tokens.length === 0) {
        throw new Error('Unexpected end of input');
    }
    const token = tokens.shift();

    if (token.type === 'IDENTIFIER') {
        const name = token.value;
        if (name === 'while') {
            return parseWhile(tokens, token.lineNumber);
        } else if (name === 'if') {
            return parseIf(tokens, token.lineNumber);
        } else if (name === 'read') {
            return parseRead(tokens, token.lineNumber);
        } else if (name === 'write') {
            return parseWrite(tokens, token.lineNumber);
        } else {
            // Assume assignment
            const varName = name;
            const nextToken = tokens.shift();
            if (!nextToken || nextToken.type !== 'ASSIGN_OP') {
                throw new Error(`Line ${token.lineNumber}: Expected assignment operator ':=' after variable '${varName}'\n${token.lineContent}`);
            }
            const expr = parseExpr(tokens);
            const semicolon = tokens.shift();
            if (!semicolon || semicolon.type !== 'PUNCTUATION' || semicolon.value !== ';') {
                throw new Error(`Line ${token.lineNumber}: Expected ';' after assignment\n${token.lineContent}`);
            }
            return { type: 'assign', varName, expr, lineNumber: token.lineNumber };
        }
    } else {
        throw new Error(`Line ${token.lineNumber}: Unexpected token '${token.value}'\n${token.lineContent}`);
    }
}

function parseWhile(tokens, lineNumber) {
    const condition = parseExpr(tokens);
    const nextToken = tokens.shift();
    if (!nextToken || nextToken.type !== 'IDENTIFIER' || nextToken.value !== 'do') {
        throw new Error(`Line ${lineNumber}: Expected 'do' after while condition`);
    }
    const body = parseBlock(tokens);
    // Optional semicolon after while loop
    if (tokens[0] && tokens[0].type === 'PUNCTUATION' && tokens[0].value === ';') {
        tokens.shift(); // Consume the semicolon
    }
    return { type: 'while', condition, body, lineNumber };
}

function parseIf(tokens, lineNumber) {
    const condition = parseExpr(tokens);
    const nextToken = tokens.shift();
    if (!nextToken || nextToken.type !== 'IDENTIFIER' || nextToken.value !== 'then') {
        throw new Error(`Line ${lineNumber}: Expected 'then' after if condition`);
    }
    const thenBranch = parseCommand(tokens);
    const elseToken = tokens.shift();
    if (!elseToken || elseToken.type !== 'IDENTIFIER' || elseToken.value !== 'else') {
        throw new Error(`Line ${lineNumber}: Expected 'else' after then branch`);
    }
    const elseBranch = parseCommand(tokens);
    return { type: 'if', condition, thenBranch, elseBranch, lineNumber };
}

function parseRead(tokens, lineNumber) {
    const varToken = tokens.shift();
    if (!varToken || varToken.type !== 'IDENTIFIER') {
        throw new Error(`Line ${lineNumber}: Expected variable name after 'read'`);
    }
    const semicolon = tokens.shift();
    if (!semicolon || semicolon.type !== 'PUNCTUATION' || semicolon.value !== ';') {
        throw new Error(`Line ${lineNumber}: Expected ';' after 'read' statement`);
    }
    return { type: 'read', varName: varToken.value, lineNumber };
}

function parseWrite(tokens, lineNumber) {
    const expr = parseExpr(tokens);
    const semicolon = tokens.shift();
    if (!semicolon || semicolon.type !== 'PUNCTUATION' || semicolon.value !== ';') {
        throw new Error(`Line ${lineNumber}: Expected ';' after 'write' statement`);
    }
    return { type: 'write', expr, lineNumber };
}

function parseBlock(tokens) {
    const openBrace = tokens.shift();
    if (!openBrace || openBrace.type !== 'PUNCTUATION' || openBrace.value !== '{') {
        throw new Error(`Expected '{' at line ${openBrace ? openBrace.lineNumber : 'unknown'}`);
    }
    const block = [];
    while (tokens[0] && (tokens[0].type !== 'PUNCTUATION' || tokens[0].value !== '}')) {
        block.push(parseCommand(tokens));
    }
    const closeBrace = tokens.shift();
    if (!closeBrace || closeBrace.type !== 'PUNCTUATION' || closeBrace.value !== '}') {
        throw new Error(`Expected '}' at line ${closeBrace ? closeBrace.lineNumber : 'unknown'}`);
    }
    return block;
}

function parseExpr(tokens) {
    if (tokens.length === 0) {
        throw new Error('Unexpected end of input while parsing expression');
    }
    let token = tokens.shift();

    if (token.type === 'NUMBER') {
        return { type: 'number', value: token.value };
    } else if (token.type === 'IDENTIFIER') {
        // Check if the next token is '(' indicating a function call
        if (tokens[0] && tokens[0].type === 'PUNCTUATION' && tokens[0].value === '(') {
            tokens.shift(); // Consume '('
            const args = [];
            if (tokens[0] && !(tokens[0].type === 'PUNCTUATION' && tokens[0].value === ')')) {
                while (true) {
                    const arg = parseExpr(tokens);
                    args.push(arg);
                    if (tokens[0] && tokens[0].type === 'PUNCTUATION' && tokens[0].value === ',') {
                        tokens.shift(); // Consume ','
                    } else {
                        break;
                    }
                }
            }
            const closingParen = tokens.shift();
            if (!closingParen || closingParen.type !== 'PUNCTUATION' || closingParen.value !== ')') {
                throw new Error(`Expected ')' in function call at line ${token.lineNumber}`);
            }
            return { type: 'function_call', name: token.value, args };
        } else {
            // Variable or nil
            return { type: 'variable', name: token.value };
        }
    } else if (token.type === 'PUNCTUATION' && token.value === '(') {
        // Parenthesized expression or pair
        if (tokens[0] && tokens[0].type === 'IDENTIFIER' && tokens[0].value === 'nil') {
            // Possible pair expression
            const leftExpr = parseExpr(tokens); // Should be 'nil'
            const dotToken = tokens.shift();
            if (!dotToken || dotToken.type !== 'PUNCTUATION' || dotToken.value !== '.') {
                throw new Error(`Expected '.' in pair expression at line ${token.lineNumber}`);
            }
            const rightExpr = parseExpr(tokens);
            const closingParen = tokens.shift();
            if (!closingParen || closingParen.type !== 'PUNCTUATION' || closingParen.value !== ')') {
                throw new Error(`Expected ')' at line ${token.lineNumber}`);
            }
            return { type: 'pair', left: leftExpr, right: rightExpr };
        } else {
            // General parenthesized expression
            const expr = parseExpr(tokens);
            const closingParen = tokens.shift();
            if (!closingParen || closingParen.type !== 'PUNCTUATION' || closingParen.value !== ')') {
                throw new Error(`Expected ')' at line ${token.lineNumber}`);
            }
            return expr;
        }
    } else if (token.type === 'IDENTIFIER' && token.value === 'nil') {
        return { type: 'nil' };
    } else {
        throw new Error(`Line ${token.lineNumber}: Unexpected token '${token.value}' in expression\n${token.lineContent}`);
    }
}

// Executor for the parsed AST
function execute(ast, context) {
    for (const command of ast) {
        executeCommand(command, context);
    }
}

function executeCommand(command, context) {
    try {
        switch (command.type) {
            case 'assign':
                context[command.varName] = evaluateExpr(command.expr, context);
                break;
            case 'while':
                while (evaluateExpr(command.condition, context) !== null) {
                    execute(command.body, context);
                }
                break;
            case 'if':
                if (evaluateExpr(command.condition, context) !== null) {
                    executeCommand(command.thenBranch, context);
                } else {
                    executeCommand(command.elseBranch, context);
                }
                break;
            case 'read':
                // Since we are not reading input, assume nil
                context[command.varName] = null;
                break;
            case 'write':
                const value = evaluateExpr(command.expr, context);
                context.__output.push(value);
                break;
            default:
                throw new Error(`Unknown command type: ${command.type}`);
        }
    } catch (error) {
        throw new Error(`Error at line ${command.lineNumber}: ${error.message}\n${command.lineContent}`);
    }
}

function evaluateExpr(expr, context) {
    switch (expr.type) {
        case 'number':
            return unaryNumber(expr.value);
        case 'variable':
            return context.hasOwnProperty(expr.name) ? context[expr.name] : null; // Assume nil for uninitialized variables
        case 'nil':
            return null;
        case 'function_call':
            return executeFunction(expr.name, expr.args, context);
        case 'pair':
            const leftValue = evaluateExpr(expr.left, context);
            const rightValue = evaluateExpr(expr.right, context);
            return cons(leftValue, rightValue);
        default:
            throw new Error(`Unknown expression type: ${expr.type}`);
    }
}

function executeFunction(name, args, context) {
    const evaluatedArgs = args.map(arg => evaluateExpr(arg, context));
    switch (name) {
        case 'cons':
            if (evaluatedArgs.length !== 2) {
                throw new Error('cons expects 2 arguments');
            }
            return cons(evaluatedArgs[0], evaluatedArgs[1]);
        case 'hd':
            if (evaluatedArgs.length !== 1) {
                throw new Error('hd expects 1 argument');
            }
            return hd(evaluatedArgs[0]);
        case 'tl':
            if (evaluatedArgs.length !== 1) {
                throw new Error('tl expects 1 argument');
            }
            return tl(evaluatedArgs[0]);
        default:
            throw new Error(`Unknown function: ${name}`);
    }
}
