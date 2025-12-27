/*
 * ==============================================
 * BINARY SEARCH TREE (BST)
 * ==============================================
 * 
 * What is it?
 *   A tree where each node has at most 2 children.
 *   Left child < Parent < Right child (always!)
 * 
 * Visual Example:
 *          [Dog]
 *         /     \
 *      [Cat]   [Fish]
 *      /   \       \
 *   [Ant] [Cow]   [Zebra]
 * 
 * Why use it?
 *   - Search is O(log n) - much faster than O(n) linear search
 *   - Insert is O(log n)
 *   - In-order traversal gives sorted order automatically!
 * 
 * Used in this browser for:
 *   - Bookmarks (sorted alphabetically by title)
 */

#ifndef BST_HPP
#define BST_HPP

#include <string>
#include <vector>

using namespace std;

template <typename K, typename V>  // K = key type, V = value type
class BST {

    // A single node in the tree
    struct Node {
        K key;           // Used for comparison (e.g., bookmark title)
        V value;         // The actual data (e.g., bookmark object)
        Node* left;      // Left child (smaller keys)
        Node* right;     // Right child (larger keys)
        
        Node(K k, V v) : key(k), value(v), left(nullptr), right(nullptr) {}
    };

    Node* root;  // The topmost node of the tree

    // ========== PRIVATE HELPER FUNCTIONS ==========

    // Recursively insert a new node
    Node* insert(Node* node, K key, V value) {
        // Base case: found empty spot, create new node here
        if (node == nullptr) {
            return new Node(key, value);
        }
        
        // If key is smaller, go left
        if (key < node->key) {
            node->left = insert(node->left, key, value);
        }
        // If key is larger, go right
        else if (key > node->key) {
            node->right = insert(node->right, key, value);
        }
        // If key is equal, update the value
        else {
            node->value = value;
        }
        
        return node;
    }

    // In-order traversal: Left → Node → Right
    // This visits nodes in SORTED order!
    void inorder(Node* node, vector<V>& result) {
        if (node == nullptr) return;
        
        inorder(node->left, result);      // 1. Visit left subtree
        result.push_back(node->value);    // 2. Add current node
        inorder(node->right, result);     // 3. Visit right subtree
    }

    // Find the node with the minimum value (used for deletion)
    Node* findMin(Node* node) {
        while (node->left != nullptr) node = node->left;
        return node;
    }

    // Recursively remove a node by key
    Node* remove(Node* node, K key) {
        if (node == nullptr) return nullptr;

        if (key < node->key) {
            node->left = remove(node->left, key);
        } else if (key > node->key) {
            node->right = remove(node->right, key);
        } else {
            // Case 1: No child or 1 child
            if (node->left == nullptr) {
                Node* temp = node->right;
                delete node;
                return temp;
            } else if (node->right == nullptr) {
                Node* temp = node->left;
                delete node;
                return temp;
            }

            // Case 2: Two children
            // Find smallest in right subtree
            Node* temp = findMin(node->right);
            node->key = temp->key;
            node->value = temp->value;
            node->right = remove(node->right, temp->key);
        }
        return node;
    }

    // Recursively delete all nodes (cleanup memory)
    void clear(Node* node) {
        if (node == nullptr) return;
        
        clear(node->left);   // Delete left subtree
        clear(node->right);  // Delete right subtree
        delete node;         // Delete current node
    }

public:
    // Constructor: start with empty tree
    BST() : root(nullptr) {}
    
    // Destructor: free all memory
    ~BST() { 
        clear(root); 
    }

    // Add a key-value pair to the tree
    void insert(K key, V value) { 
        root = insert(root, key, value); 
    }

    // Remove a key-value pair from the tree
    void remove(K key) {
        root = remove(root, key);
    }

    // Get all values in sorted order by key
    vector<V> getAll() {
        vector<V> result;
        inorder(root, result);
        return result;
    }

    // Search for a value by its key
    // Returns pointer to value, or nullptr if not found
    V* search(K key) {
        Node* current = root;
        
        while (current != nullptr) {
            if (key == current->key) {
                return &current->value;  // Found it!
            }
            
            // If key is smaller, go left
            if (key < current->key) {
                current = current->left;
            }
            // If key is larger, go right
            else {
                current = current->right;
            }
        }
        
        return nullptr;  // Not found
    }
};

#endif
