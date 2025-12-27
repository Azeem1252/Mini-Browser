/*
 * ==============================================
 * TRIE (Prefix Tree)
 * ==============================================
 * 
 * What is it?
 *   A tree where each path from root to node represents a string.
 *   Used for fast prefix searching (like autocomplete!)
 * 
 * Visual Example (storing: "cat", "car", "card", "dog"):
 *   
 *            [root]
 *           /      \
 *         c         d
 *         |         |
 *         a         o
 *        / \        |
 *       t   r      g*
 *       *   |
 *           d*
 *   
 *   * = end of word
 * 
 * Why use it?
 *   - O(L) to insert (L = length of word)
 *   - O(L) to search for prefix
 *   - Get all words starting with prefix very fast
 * 
 * Used in this browser for:
 *   - URL auto-complete (type "goo" → suggests "google.com")
 */

#ifndef TRIE_HPP
#define TRIE_HPP

#include <string>
#include <vector>
#include <map>

using namespace std;

class Trie {
    // A single node in the trie
    struct Node {
        map<char, Node*> children;  // Map: character → child node
        bool isEndOfWord;           // True if this node ends a word
        
        Node() : isEndOfWord(false) {}
    };

    Node* root;  // The root of the trie

    // Helper: collect all words starting from a node
    void collectWords(Node* node, string currentPrefix, vector<string>& results) {
        // If this node marks end of a word, add it
        if (node->isEndOfWord) {
            results.push_back(currentPrefix);
        }
        
        // Recursively check all children
        for (auto const& pair : node->children) {
            char character = pair.first;
            Node* childNode = pair.second;
            
            collectWords(childNode, currentPrefix + character, results);
        }
    }

public:
    // Constructor: create root node
    Trie() { 
        root = new Node(); 
    }
    
    // Destructor (simplified - in production would need proper cleanup)
    ~Trie() { 
        // TODO: Recursive cleanup of all nodes
    }

    // Insert a word into the trie
    void insert(string word) {
        Node* current = root;
        
        // Go through each character
        for (char ch : word) {
            // If path doesn't exist, create it
            if (current->children.find(ch) == current->children.end()) {
                current->children[ch] = new Node();
            }
            
            // Move to the child node
            current = current->children[ch];
        }
        
        // Mark the end of this word
        current->isEndOfWord = true;
    }

    // Find all words that start with the given prefix
    vector<string> search(string prefix) {
        vector<string> results;
        Node* current = root;
        
        // Navigate to the node representing the prefix
        for (char ch : prefix) {
            // If prefix doesn't exist, return empty
            if (current->children.find(ch) == current->children.end()) {
                return results;
            }
            current = current->children[ch];
        }
        
        // Collect all words from this point
        collectWords(current, prefix, results);
        
        return results;
    }
};

#endif
