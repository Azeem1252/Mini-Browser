/*
 * ==============================================
 * CIRCULAR LINKED LIST
 * ==============================================
 * 
 * What is it?
 *   A linked list where the last node points back to the first.
 *   Forms a circle - you can keep going forever!
 * 
 * Visual Example:
 *   ┌─→ [Tab1] → [Tab2] → [Tab3] ─┐
 *   └──────────────────────────────┘
 *   
 * Why use it?
 *   - Perfect for cycling through items (like browser tabs)
 *   - O(1) to add new item
 *   - O(1) to move to next item
 *   - After last item, automatically goes to first
 * 
 * Used in this browser for:
 *   - Tab management (Ctrl+Tab cycles through tabs)
 */

#ifndef CIRCULAR_LINKED_LIST_HPP
#define CIRCULAR_LINKED_LIST_HPP

template <typename T>
class CircularLinkedList {
public:
    // A single node in the list
    struct Node {
        T data;        // The stored value
        Node* next;    // Points to the next node (or back to first)
        
        Node(T val) : data(val), next(nullptr) {}
    };

private:
    Node* cursor;    // Points to the "current" node
    int listSize;    // Number of nodes in the list

public:
    // Constructor: start with empty list
    CircularLinkedList() : cursor(nullptr), listSize(0) {}
    
    // Destructor: clean up all nodes
    ~CircularLinkedList() {
        if (cursor == nullptr) return;
        
        // Start from the node after cursor
        Node* current = cursor->next;
        
        // Delete all nodes until we get back to cursor
        while (current != cursor) {
            Node* nodeToDelete = current;
            current = current->next;
            delete nodeToDelete;
        }
        
        // Delete the cursor node itself
        delete cursor;
    }

    // Add a new item to the list
    void add(T val) {
        Node* newNode = new Node(val);
        
        if (cursor == nullptr) {
            // First node - points to itself (forms a circle of 1)
            newNode->next = newNode;
            cursor = newNode;
        } else {
            // Insert after cursor
            // Before: cursor → A → B → cursor
            // After:  cursor → newNode → A → B → cursor
            newNode->next = cursor->next;
            cursor->next = newNode;
        }
        
        listSize++;
    }

    // Move cursor to the next item
    // After the last item, this wraps to the first
    void advance() {
        if (cursor != nullptr) {
            cursor = cursor->next;
        }
    }

    // Get the current item
    T& current() {
        return cursor->data;
    }

    // Get the cursor node (for internal use)
    Node* getCursor() { 
        return cursor; 
    }
    
    // Get number of items in the list
    int size() const { 
        return listSize; 
    }

    // Remove the current item
    void removeCurrent() {
        if (cursor == nullptr) return;
        
        if (listSize == 1) {
            // Only one node - just delete it
            delete cursor;
            cursor = nullptr;
        } else {
            // Find the node BEFORE cursor
            // (we need it to fix the circle)
            Node* previous = cursor;
            while (previous->next != cursor) {
                previous = previous->next;
            }
            
            // Skip over cursor in the chain
            previous->next = cursor->next;
            
            // Save and delete the old cursor
            Node* nodeToDelete = cursor;
            cursor = cursor->next;  // Move cursor to next node
            delete nodeToDelete;
        }
        
        listSize--;
    }
};

#endif
