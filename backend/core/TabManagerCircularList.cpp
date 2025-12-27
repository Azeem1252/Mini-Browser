/*
 * ==============================================
 * TAB MANAGER (Like Chrome Tabs!)
 * ==============================================
 * 
 * What is it?
 *   Manages multiple browser tabs, just like in Chrome or Firefox.
 *   Each tab has its own navigation history.
 * 
 * Why use a Circular Linked List?
 *   - Can cycle through tabs infinitely (last tab → first tab)
 *   - O(1) to add new tab
 *   - O(1) to switch to next tab
 *   - Perfect for Ctrl+Tab cycling behavior!
 */

#include "dsa/CircularLinkedList.hpp"
#include "StackNavigation.cpp"  // Each tab has its own navigation
#include <string>
#include <vector>

using namespace std;

// Represents a single browser tab
struct Tab {
    int id;                 // Unique tab identifier (1, 2, 3, ...)
    string title;           // Tab title shown in the tab bar
    StackNavigation nav;    // Back/Forward navigation for THIS tab
};

class TabManager {
private:
    CircularLinkedList<Tab*> tabs;  // List of all open tabs
    int nextTabId;                   // Counter for unique tab IDs

public:
    // Constructor: Start with one empty tab
    TabManager() : nextTabId(1) {
        createNewTab();
    }

    // Open a new tab
    void createNewTab() {
        // Create a new tab with:
        // - Unique ID
        // - Default title "New Tab"
        // - Fresh navigation history
        Tab* newTab = new Tab{nextTabId, "New Tab", StackNavigation()};
        nextTabId++;  // Increment for next tab
        
        tabs.add(newTab);
    }

    // Switch to the next tab (cycles back to first after last)
    // This is what happens when you press Ctrl+Tab
    void switchTab() {
        tabs.advance();
    }

    // Get the currently active tab
    Tab* getCurrentTab() {
        if (tabs.size() == 0) {
            return nullptr;  // No tabs open
        }
        return tabs.current();
    }

    // Close the current tab
    void closeCurrentTab() {
        // Always keep at least one tab open
        if (tabs.size() <= 1) {
            return;
        }
        
        // Free the memory for this tab
        delete tabs.current();
        
        // Remove from the list
        tabs.removeCurrent();
    }

    // Get the total number of open tabs
    int getTabCount() {
        return tabs.size();
    }
};
