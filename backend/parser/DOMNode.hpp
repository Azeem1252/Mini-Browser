/*
 * ==============================================
 * DOM NODE (Document Object Model)
 * ==============================================
 * 
 * What is it?
 *   Represents a single element in an HTML page.
 *   The browser converts HTML into a tree of these nodes.
 * 
 * Visual Example (for: <div><h1>Hello</h1><p>World</p></div>):
 *   
 *        [div]
 *       /     \
 *     [h1]   [p]
 *      |      |
 *   "Hello" "World"
 * 
 * This is called an N-ary Tree:
 *   - Each node can have any number of children
 *   - Not just 2 like a binary tree
 */

#ifndef DOM_NODE_HPP
#define DOM_NODE_HPP

#include <string>
#include <vector>

using namespace std;

struct DOMNode {
    string tagName;                // The tag (e.g., "div", "h1", "p")
    string textContent;            // Text inside the element
    vector<DOMNode*> children;     // Child elements

    // Constructor
    DOMNode(string tag, string text = "")
        : tagName(tag), textContent(text) {}

    // Destructor: clean up all children
    ~DOMNode() {
        for (auto child : children) {
            delete child;  // Recursively deletes all descendants
        }
    }

    // Add a child element
    void addChild(DOMNode* child) {
        children.push_back(child);
    }
};

#endif
