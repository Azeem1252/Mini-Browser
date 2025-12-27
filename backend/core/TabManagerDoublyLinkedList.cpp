/*
 * ==============================================
 * TAB MANAGER (Doubly Linked List Implementation)
 * ==============================================
 * 
 * Each tab has its own navigation history.
 * Using Doubly Linked List for:
 *   - O(1) insertion/deletion
 *   - Efficient bidirectional traversal
 */

#include "dsa/DoublyLinkedList.hpp"
#include "StackNavigation.cpp"
#include <string>
#include <vector>
#include <fstream>
#include <filesystem>

using namespace std;

// Represents a single browser tab
struct Tab {
    int id;                 // Unique tab identifier
    string title;           // Tab title
    StackNavigation nav;    // Back/Forward navigation for THIS tab
};

class TabManager {
private:
    DoublyLinkedList<Tab*> tabs;
    typename DoublyLinkedList<Tab*>::Node* currentTabNode;
    int nextTabId;

public:
    TabManager() : currentTabNode(nullptr), nextTabId(1) {
        createNewTab();
    }

    ~TabManager() {
        // DoublyLinkedList destructor will clear nodes, 
        // but we need to delete the Tab pointers first.
        auto current = tabs.getHead();
        while (current) {
            delete current->data;
            current = current->next;
        }
    }

    void createNewTab() {
        Tab* newTab = new Tab{nextTabId++, "New Tab", StackNavigation()};
        tabs.append(newTab);
        
        // If it's the first tab, set it as current
        if (currentTabNode == nullptr) {
            currentTabNode = tabs.getHead();
        }
    }

    // Switch to next tab (circular cycling)
    void switchTab() {
        if (!currentTabNode) return;
        
        if (currentTabNode->next) {
            currentTabNode = currentTabNode->next;
        } else {
            currentTabNode = tabs.getHead(); // Wrap to beginning
        }
    }

    // Switch to previous tab (circular cycling)
    void switchTabPrev() {
        if (!currentTabNode) return;
        
        if (currentTabNode->prev) {
            currentTabNode = currentTabNode->prev;
        } else {
            currentTabNode = tabs.getTail(); // Wrap to end
        }
    }

    Tab* getCurrentTab() {
        return currentTabNode ? currentTabNode->data : nullptr;
    }

    void closeCurrentTab() {
        if (tabs.size() <= 1 || !currentTabNode) {
            return;
        }

        auto nodeToDelete = currentTabNode;
        
        // Decide which tab becomes active after closing
        if (currentTabNode->next) {
            currentTabNode = currentTabNode->next;
        } else {
            currentTabNode = currentTabNode->prev;
        }

        delete nodeToDelete->data;
        tabs.removeNode(nodeToDelete);
    }

    int getTabCount() {
        return tabs.size();
    }

    // Direct tab restoration (for Session/Undo)
    void restoreTab(int id, string title, string url) {
        Tab* revivedTab = new Tab{id, title, StackNavigation()};
        revivedTab->nav.navigateTo(url);
        tabs.append(revivedTab);
        if (!currentTabNode) currentTabNode = tabs.getHead();
        if (id >= nextTabId) nextTabId = id + 1;
    }

    // Persistence logic
    void saveSession() {
        ofstream file("tabs.txt");
        if (!file.is_open()) return;

        auto current = tabs.getHead();
        while (current) {
            Tab* t = current->data;
            file << t->id << "|" << t->title << "|" << t->nav.getCurrentUrl() << endl;
            
            // Save tab's history stack to its own file
            string stackFile = "tab_history_" + to_string(t->id) + ".txt";
            t->nav.saveToFile(stackFile);
            
            current = current->next;
        }
        file.close();
    }

    void loadSession() {
        ifstream file("tabs.txt");
        if (!file.is_open()) return;

        // Clear existing initial tab
        while (tabs.size() > 0) closeCurrentTab();

        string line;
        while (getline(file, line)) {
            size_t p1 = line.find("|");
            size_t p2 = line.find("|", p1 + 1);
            if (p1 == string::npos || p2 == string::npos) continue;

            int id = stoi(line.substr(0, p1));
            string title = line.substr(p1 + 1, p2 - p1 - 1);
            string url = line.substr(p2 + 1);

            restoreTab(id, title, url);
            
            // Restore history stack
            string stackFile = "tab_history_" + to_string(id) + ".txt";
            getCurrentTab()->nav.loadFromFile(stackFile);
        }
        file.close();
        
        // If file was empty, ensure at least one tab
        if (tabs.size() == 0) createNewTab();
    }

    // Helper to find a tab by ID (to maintain compatibility if needed)
    Tab* getTabById(int id) {
        auto current = tabs.getHead();
        while (current) {
            if (current->data->id == id) return current->data;
            current = current->next;
        }
        return nullptr;
    }
};
