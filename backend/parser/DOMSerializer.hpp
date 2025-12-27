/*
 * ==============================================
 * DOM SERIALIZER
 * ==============================================
 * 
 * What is it?
 *   Converts a DOM tree into a JSON string.
 *   This lets us send the parsed HTML to the frontend.
 * 
 * Example Output:
 *   {
 *     "tagName": "div",
 *     "textContent": "",
 *     "children": [
 *       {"tagName": "h1", "textContent": "Hello", "children": []}
 *     ]
 *   }
 */

#include "DOMNode.hpp"
#include <sstream>
#include <string>

using namespace std;

// Convert a DOM tree to a JSON string
string serializeDOM(DOMNode* node) {
    ostringstream json;
    
    // Start the JSON object
    json << "{";
    
    // Add the tag name
    json << "\"tagName\":\"" << node->tagName << "\",";
    
    // Add the text content
    json << "\"textContent\":\"" << node->textContent << "\",";
    
    // Add the children array
    json << "\"children\":[";
    
    for (size_t i = 0; i < node->children.size(); i++) {
        // Recursively serialize each child
        json << serializeDOM(node->children[i]);
        
        // Add comma between children (but not after the last one)
        if (i < node->children.size() - 1) {
            json << ",";
        }
    }
    
    json << "]}";
    
    return json.str();
}
