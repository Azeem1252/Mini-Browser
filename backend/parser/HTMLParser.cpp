/*
 * ==============================================
 * HTML PARSER
 * ==============================================
 * 
 * What is it?
 *   Converts an HTML string into a tree of DOMNodes.
 *   This is what happens when your browser reads a webpage!
 * 
 * How it works:
 *   1. Find each tag (things in < >)
 *   2. Opening tag (<div>) → create new node, push to stack
 *   3. Closing tag (</div>) → pop from stack
 *   4. Text between tags → add to current node
 * 
 * Example:
 *   Input:  "<h1>Hello</h1><p>World</p>"
 *   Output: Tree with root, h1 child (text: Hello), p child (text: World)
 * 
 * Why use a Stack?
 *   - HTML is nested (tags inside tags)
 *   - Stack tracks which tag we're currently inside
 *   - When we see </div>, pop to go back to parent
 */

#include "DOMNode.hpp"
#include "../core/dsa/Stack.hpp"
#include <iostream>
#include <string>
#include <regex>

using namespace std;

class HTMLParser {
public:
    // Parse an HTML string into a DOM tree
    DOMNode* parse(string html) {
        // Create the root node (parent of everything)
        DOMNode* root = new DOMNode("root");
        
        // Stack to track nested elements
        // The top of the stack is always the "current" parent
        Stack<DOMNode*> parentStack;
        parentStack.push(root);

        size_t position = 0;
        
        while (position < html.length()) {
            
            // ===== CASE 1: Found a tag (starts with <) =====
            if (html[position] == '<') {
                // Find the end of this tag
                size_t tagEnd = html.find('>', position);
                if (tagEnd == string::npos) break;  // No closing >, stop

                // Extract the tag name (everything between < and >)
                string tagContent = html.substr(position + 1, tagEnd - position - 1);
                
                // ----- Closing tag (like </div>) -----
                if (tagContent[0] == '/') {
                    // Go back to parent (pop the stack)
                    if (parentStack.size() > 1) {
                        parentStack.pop();
                    }
                }
                // ----- Opening tag (like <div>) -----
                else {
                    // Create a new node for this tag
                    DOMNode* newNode = new DOMNode(tagContent);
                    
                    // Add it as a child of the current parent
                    parentStack.peek()->addChild(newNode);
                    
                    // Self-closing tags (img, br) don't need to be pushed
                    bool isSelfClosing = (tagContent == "img" || tagContent == "br");
                    
                    if (!isSelfClosing) {
                        // This becomes the new parent for nested elements
                        parentStack.push(newNode);
                    }
                }
                
                // Move past this tag
                position = tagEnd + 1;
            }
            // ===== CASE 2: Text content (not inside a tag) =====
            else {
                // Find where the next tag starts
                size_t nextTagStart = html.find('<', position);
                
                // Extract the text between current position and next tag
                string text = html.substr(position, nextTagStart - position);
                
                // Only add if it's not just whitespace
                bool hasContent = text.find_first_not_of(" \t\n\r") != string::npos;
                
                if (!text.empty() && hasContent) {
                    // Add text to the current parent's text content
                    parentStack.peek()->textContent += text;
                }
                
                // Move to the next tag
                position = nextTagStart;
            }
        }

        return root;
    }

    // Debug: print the DOM tree with indentation
    void printTree(DOMNode* node, int depth = 0) {
        // Print indentation
        for (int i = 0; i < depth; i++) {
            cout << "  ";
        }
        
        // Print this node
        cout << "<" << node->tagName << "> " << node->textContent << endl;
        
        // Recursively print children
        for (auto child : node->children) {
            printTree(child, depth + 1);
        }
    }
};
