# While Language Interpreter and Tree Visualizer

Use it now ! 
🌐 [**Enter Site**](https://renanbazinin.github.io/whileCompiler-/)  


This project is an interpreter and visualizer for a custom "While" language designed to operate on tree data structures. The interpreter supports code execution in the "While" language, allowing users to input programs that manipulate tree-based data, visualize tree transformations, and see final results.

## Features
- Parse and interpret code written in the custom "While" language.
- Support for list and tree-based data representations.
- Real-time input validation for tree structures.
- Visualization of tree transformations based on the code provided.
- Display final values of variables in both tree and list notation.

## Example Program
Example While language code that reverses a list represented as a tree:
```plaintext
read x;
y := nil;
while x do {
    y := cons (hd x) y;
    x := tl x;
};
write y;
```

### How It Works
- **Input**: Users can enter code in the While language and specify the input variable `x` using tree notation.
- **Execution**: The interpreter processes the input, evaluates the code, and outputs the final value of `y`.
- **Visualization**: A canvas is used to draw the resulting tree structure of variable `y` after execution.

## Getting Started
1. **Ener here and enjoy**

🌐 [**Enter Site**](https://renanbazinin.github.io/whileCompiler-/)  


OR

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/renanbazinin/whileCompiler-
   ```

2. **HTML, CSS, and JavaScript Setup**:
   - All code is contained in three files: `index.html`, `styles.css`, and `script.js`.
   - Simply open `index.html` in your browser to run the project.

3. **Usage**:
   - Enter the "While" language code in the input text area.
   - Specify the input variable `x` in tree notation (e.g., `(nil.nil)`).
   - Click "Run Program" to interpret the code, visualize the transformations, and see the output.

## Input and Output Example
- **Input Example**:
  ```plaintext
  read x;
  while x do {
      y := cons (hd x) y;
      x := tl x;
  };
  write y;
  ```


## Real-Time Input Validation
- The input field for variable `x` provides real-time validation:
  - Green indicates a valid expression.
  - Red indicates an invalid or incomplete expression.

## Screenshots
![Example](https://i.imgur.com/fko1gp9.pngurl>)


