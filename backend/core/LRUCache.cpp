/*
 * ==============================================
 * LRU CACHE (Least Recently Used Cache)
 * ==============================================
 * 
 * What is it?
 *   A cache that removes the least recently used item 
 *   when it runs out of space.
 * 
 * How it works:
 *   - Uses a Hash Map for O(1) lookups
 *   - Uses a Doubly Linked List to track usage order
 *   - Most recently used items go to the front
 *   - Least recently used items are at the back
 * 
 * Time Complexity: O(1) for both get and put
 */

#include "dsa/HashMap.hpp"
#include "dsa/DoublyLinkedList.hpp"
#include <string>

using namespace std;

// Stores a key-value pair for the cache
struct CacheEntry {
    string key;   // The lookup key (e.g., URL)
    string data;  // The cached content
};

class LRUCache {
private:
    int capacity;  // Maximum number of items in cache
    
    // The list keeps items in order: front = most recent, back = least recent
    DoublyLinkedList<CacheEntry> orderList;
    
    // The map allows quick lookup of items by key
    HashMap<string, typename DoublyLinkedList<CacheEntry>::Node*> lookupMap;

public:
    // Create a cache with given capacity
    LRUCache(int maxSize) : capacity(maxSize) {}

    // Get an item from the cache
    // Returns empty string if not found
    string get(string key) {
        // Step 1: Look up the key in our map
        auto nodePointer = lookupMap.get(key);
        
        // If key doesn't exist, return empty string
        if (!nodePointer) {
            return "";
        }

        // Step 2: Get the actual node and its value
        auto node = *nodePointer;
        string value = node->data.data;

        // Step 3: Move this item to the front (mark as recently used)
        orderList.prepend(node->data);   // Add copy to front
        orderList.removeNode(node);      // Remove old position
        lookupMap.put(key, orderList.getHead());  // Update map

        return value;
    }

    // Add or update an item in the cache
    void put(string key, string data) {
        // Check if key already exists
        auto nodePointer = lookupMap.get(key);
        
        if (nodePointer) {
            // Key exists: remove old entry (we'll add updated one)
            auto node = *nodePointer;
            orderList.removeNode(node);
        } 
        else if (orderList.size() == capacity) {
            // Cache is full: remove the least recently used item (at the back)
            auto leastUsed = orderList.getTail();
            lookupMap.remove(leastUsed->data.key);
            orderList.removeNode(leastUsed);
        }

        // Add the new/updated item at the front (most recently used)
        orderList.prepend({key, data});
        lookupMap.put(key, orderList.getHead());
    }
};
