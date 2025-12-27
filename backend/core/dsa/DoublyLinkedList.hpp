/*
 * ==============================================
 * DOUBLY LINKED LIST
 * ==============================================
 * 
 * What is it?
 *   A linked list where each node points to BOTH next and previous.
 *   Can traverse forward and backward!
 * 
 * Visual Example:
 *   nullptr ←→ [A] ←→ [B] ←→ [C] ←→ nullptr
 *              head              tail
 * 
 * Why use it?
 *   - O(1) to add at front or back
 *   - O(1) to remove any node (if you have the pointer)
 *   - Can traverse in both directions
 *   - Perfect for history (go back in time!)
 * 
 * Used in this browser for:
 *   - Browsing history
 *   - LRU Cache (combined with HashMap)
 */

#ifndef DOUBLY_LINKED_LIST_HPP
#define DOUBLY_LINKED_LIST_HPP

#include <iostream>

template <typename T>
class DoublyLinkedList {
public:
    // A single node in the list
    struct Node {
        T data;        // The stored value
        Node* next;    // Points to the next node
        Node* prev;    // Points to the previous node
        
        Node(T val) : data(val), next(nullptr), prev(nullptr) {}
    };

private:
    Node* head;      // First node in the list
    Node* tail;      // Last node in the list
    int listSize;    // Number of nodes

public:
    // Constructor: start with empty list
    DoublyLinkedList() : head(nullptr), tail(nullptr), listSize(0) {}
    
    // Destructor: free all memory
    ~DoublyLinkedList() { 
        clear(); 
    }

    // Add item at the END of the list
    void append(T val) {
        Node* newNode = new Node(val);
        
        if (head == nullptr) {
            // List is empty - new node is both head and tail
            head = newNode;
            tail = newNode;
        } else {
            // Add after current tail
            // Before: ... ←→ [tail] ←→ nullptr
            // After:  ... ←→ [tail] ←→ [newNode] ←→ nullptr
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
        
        listSize++;
    }

    // Add item at the BEGINNING of the list
    void prepend(T val) {
        Node* newNode = new Node(val);
        
        if (head == nullptr) {
            // List is empty
            head = newNode;
            tail = newNode;
        } else {
            // Add before current head
            // Before: nullptr ←→ [head] ←→ ...
            // After:  nullptr ←→ [newNode] ←→ [head] ←→ ...
            newNode->next = head;
            head->prev = newNode;
            head = newNode;
        }
        
        listSize++;
    }

    // Delete all nodes
    void clear() {
        Node* current = head;
        
        while (current != nullptr) {
            Node* nodeToDelete = current;
            current = current->next;
            delete nodeToDelete;
        }
        
        head = nullptr;
        tail = nullptr;
        listSize = 0;
    }

    // Get first node
    Node* getHead() const { return head; }
    
    // Get last node
    Node* getTail() const { return tail; }
    
    // Get number of nodes
    int size() const { return listSize; }

    // Remove a specific node
    // This is O(1) because we have the node pointer!
    void removeNode(Node* node) {
        if (node == nullptr) return;
        
        // Fix the previous node's 'next' pointer
        if (node->prev != nullptr) {
            node->prev->next = node->next;
        }
        
        // Fix the next node's 'prev' pointer
        if (node->next != nullptr) {
            node->next->prev = node->prev;
        }
        
        // Update head if we're removing the first node
        if (node == head) {
            head = node->next;
        }
        
        // Update tail if we're removing the last node
        if (node == tail) {
            tail = node->prev;
        }
        
        delete node;
        listSize--;
    }
};

#endif
