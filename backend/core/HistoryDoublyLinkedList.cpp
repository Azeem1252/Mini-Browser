#pragma once
/*
 * ==============================================
 * BROWSING HISTORY MANAGER
 * ==============================================
 * 
 * What is it?
 *   Keeps track of all URLs the user has visited.
 *   New entries are added at the end (most recent last).
 * 
 * Why use a Doubly Linked List?
 *   - O(1) to add new entry at the end
 *   - Can traverse both forward and backward
 *   - Easy to remove entries from any position
 *   - No size limit (unlike arrays)
 */

#include "dsa/DoublyLinkedList.hpp"
#include <string>
#include <vector>

using namespace std;

class HistoryManager {
private:
    // Each node stores one visited URL
    DoublyLinkedList<string> historyList;

public:
    // Add a URL to the history
    // New entries go at the end (chronological order)
    void addEntry(string url) {
        historyList.append(url);
    }

    // Get all history entries as a list
    // Returns URLs in the order they were visited
    vector<string> getHistory() {
        vector<string> result;
        
        // Start from the first (oldest) entry
        auto* currentNode = historyList.getHead();
        
        // Walk through the entire list
        while (currentNode != nullptr) {
            result.push_back(currentNode->data);
            currentNode = currentNode->next;  // Move to next entry
        }
        
        return result;
    }

    // Delete all history entries
    void clearHistory() {
        historyList.clear();
    }
};
