// TreeUtils.js

// Constructor for creating a new tree node
function TreeNode(left = null, right = null) {
    this.left = left;
    this.right = right;
}

// cons: Construct a new node with two children
function cons(left, right) {
    return new TreeNode(left, right);
}

// hd (head): Retrieve the left child of a node
function hd(node) {
    if (node === null) return null;
    return node.left;
}

// tl (tail): Retrieve the right child of a node
function tl(node) {
    if (node === null) return null;
    return node.right;
}

// Function to represent numbers in unary as full binary trees
function unaryNumber(n) {
    if (n <= 0) {
        return null; // nil
    } else {
        return cons(null, unaryNumber(n - 1));
    }
}

// Function to visualize the tree as a string
function treeToString(node) {
    if (node === null) {
        return 'nil';
    }
    return `( ${treeToString(node.left)} . ${treeToString(node.right)} )`;
}

// Function to display the tree visually in HTML
function displayTree(node, container) {
    const element = document.createElement('div');
    element.classList.add('tree-node');

    if (node === null) {
        element.textContent = 'nil';
        element.classList.add('leaf');
    } else {
        element.textContent = '.';
        if (node.left !== null || node.right !== null) {
            displayTree(node.left, element);
            displayTree(node.right, element);
        }
    }
    container.appendChild(element);
}

// Function to convert unary tree back to number
function treeToNumber(node) {
    if (node === null) return 0;
    return 1 + treeToNumber(node.right);
}
