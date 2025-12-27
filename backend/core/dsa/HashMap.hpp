/*
 * ==============================================
 * HASH MAP (Dictionary)
 * ==============================================
 * 
 * What is it?
 *   A data structure that stores key-value pairs.
 *   Like a dictionary: look up the word (key) to get the definition (value).
 * 
 * How it works:
 *   1. Take the key (e.g., "google.com")
 *   2. Run it through a hash function → gives a number (e.g., 42)
 *   3. Store the value at index 42 in an array
 *   4. To retrieve: hash the key again → go to index 42 → get value!
 * 
 * Collision Handling (Chaining):
 *   If two keys hash to the same index, we make a linked list there.
 *   Index 42: [key1 → key2 → key3]
 * 
 * Why use it?
 *   - O(1) average for insert, search, delete
 *   - Much faster than O(n) linear search
 * 
 * Used in this browser for:
 *   - LRU Cache (fast URL lookup)
 */

#ifndef HASHMAP_HPP
#define HASHMAP_HPP

#include <string>
#include <functional>

template <typename K, typename V>
class HashMap {
    
    // A single entry in the hash table
    struct Entry {
        K key;
        V value;
        Entry* next;  // For chaining (collision handling)
        
        Entry(K k, V v) : key(k), value(v), next(nullptr) {}
    };

    // Size of the internal array (prime number is good for hashing)
    static const int TABLE_SIZE = 101;
    
    // The array of entry chains
    Entry* table[TABLE_SIZE];

    // Convert a key to an array index
    int hash(const K& key) const {
        // Use C++ standard hash function, then mod to fit in our table
        return std::hash<K>{}(key) % TABLE_SIZE;
    }

public:
    // Constructor: initialize all slots to empty (nullptr)
    HashMap() {
        for (int i = 0; i < TABLE_SIZE; i++) {
            table[i] = nullptr;
        }
    }
    
    // Destructor: free all entries
    ~HashMap() {
        for (int i = 0; i < TABLE_SIZE; i++) {
            Entry* current = table[i];
            while (current != nullptr) {
                Entry* entryToDelete = current;
                current = current->next;
                delete entryToDelete;
            }
        }
    }

    // Add or update a key-value pair
    void put(K key, V value) {
        int index = hash(key);
        
        // Check if key already exists (update it)
        Entry* current = table[index];
        while (current != nullptr) {
            if (current->key == key) {
                current->value = value;  // Update existing
                return;
            }
            current = current->next;
        }
        
        // Key doesn't exist - add new entry at front of chain
        Entry* newEntry = new Entry(key, value);
        newEntry->next = table[index];
        table[index] = newEntry;
    }

    // Get a value by key
    // Returns pointer to value, or nullptr if not found
    V* get(K key) {
        int index = hash(key);
        
        // Search through the chain at this index
        Entry* current = table[index];
        while (current != nullptr) {
            if (current->key == key) {
                return &current->value;  // Found!
            }
            current = current->next;
        }
        
        return nullptr;  // Not found
    }

    // Remove a key-value pair
    void remove(K key) {
        int index = hash(key);
        
        Entry* current = table[index];
        Entry* previous = nullptr;
        
        // Search for the key
        while (current != nullptr) {
            if (current->key == key) {
                // Found it! Remove from chain
                if (previous != nullptr) {
                    previous->next = current->next;
                } else {
                    table[index] = current->next;
                }
                delete current;
                return;
            }
            previous = current;
            current = current->next;
        }
    }
};

#endif
