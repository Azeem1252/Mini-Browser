/*
 * ==============================================
 * BROWSER ENGINE DEMO
 * ==============================================
 * 
 * This file demonstrates all data structures working together
 * without needing the HTTP server.
 * 
 * Run this to see all DSAs in action!
 */

#include "core/StackNavigation.cpp"
#include "core/HistoryDoublyLinkedList.cpp"
#include "core/TabManagerCircularList.cpp"
#include "core/BookmarkBST.cpp"
#include "network/HttpClient.cpp"
#include "parser/HTMLParser.cpp"
#include <iostream>
#include <string>

using namespace std;

// Helper function to print a separator line
void printLine() {
    cout << "=====================================\n";
}

int main() {
    // Welcome banner
    cout << "\n";
    cout << "╔══════════════════════════════════════════════════════════╗\n";
    cout << "║   MINI WEB BROWSER ENGINE - DEMO MODE                   ║\n";
    cout << "╚══════════════════════════════════════════════════════════╝\n";
    cout << "\n";
    cout << "📚 Data Structures Implemented:\n";
    cout << "   ✓ Stack (Navigation: Back/Forward)\n";
    cout << "   ✓ Doubly Linked List (Browsing History)\n";
    cout << "   ✓ Circular Linked List (Tab Management)\n";
    cout << "   ✓ Binary Search Tree (Bookmarks)\n";
    cout << "   ✓ Hash Map + DoublyLL (LRU Cache)\n";
    cout << "   ✓ Queue (Download Manager)\n";
    cout << "   ✓ Trie (URL Auto-complete)\n";
    cout << "\n";
    
    // Initialize all components
    TabManager tabManager;
    BookmarkManager bookmarkManager;
    HistoryManager historyManager;
    HttpClient httpClient;
    HTMLParser htmlParser;
    
    // ==============================================
    // DEMO 1: Navigation with Stack
    // ==============================================
    printLine();
    cout << "DEMO 1: Navigation (Stack)\n";
    printLine();
    
    Tab* currentTab = tabManager.getCurrentTab();
    cout << "Starting at: " << currentTab->nav.getCurrentUrl() << "\n\n";
    
    // Simulate browsing
    currentTab->nav.navigateTo("google.com");
    historyManager.addEntry("google.com");
    
    currentTab->nav.navigateTo("github.com");
    historyManager.addEntry("github.com");
    
    currentTab->nav.navigateTo("bing.com");
    historyManager.addEntry("bing.com");
    
    cout << "\nAfter visiting: google.com → github.com → bing.com\n";
    cout << "Current URL: " << currentTab->nav.getCurrentUrl() << "\n";
    
    // Test back button
    cout << "\n--- Going BACK ---\n";
    cout << "Now at: " << currentTab->nav.goBack() << "\n";
    cout << "Now at: " << currentTab->nav.goBack() << "\n";
    
    // Test forward button
    cout << "\n--- Going FORWARD ---\n";
    cout << "Now at: " << currentTab->nav.goForward() << "\n";
    
    // ==============================================
    // DEMO 2: History with Doubly Linked List
    // ==============================================
    printLine();
    cout << "\nDEMO 2: History (Doubly Linked List)\n";
    printLine();
    
    auto history = historyManager.getHistory();
    cout << "Browsing History (" << history.size() << " entries):\n";
    for (const auto& url : history) {
        cout << "  - " << url << "\n";
    }
    
    // ==============================================
    // DEMO 3: Bookmarks with BST
    // ==============================================
    printLine();
    cout << "\nDEMO 3: Bookmarks (Binary Search Tree)\n";
    printLine();
    
    // Add some bookmarks
    bookmarkManager.addBookmark("Google", "google.com");
    bookmarkManager.addBookmark("GitHub", "github.com");
    bookmarkManager.addBookmark("Bing", "bing.com");
    
    // Get all (automatically sorted by title)
    auto bookmarks = bookmarkManager.getAllBookmarks();
    cout << "Bookmarks (Sorted Alphabetically):\n";
    for (const auto& bm : bookmarks) {
        cout << "  ⭐ " << bm.title << " -> " << bm.url << "\n";
    }
    
    // ==============================================
    // DEMO 4: Tab Management with Circular List
    // ==============================================
    printLine();
    cout << "\nDEMO 4: Tab Management (Circular Linked List)\n";
    printLine();
    
    cout << "Initial tabs: " << tabManager.getTabCount() << "\n";
    
    // Create more tabs
    tabManager.createNewTab();
    tabManager.createNewTab();
    cout << "After creating 2 more: " << tabManager.getTabCount() << " tabs\n";
    
    // Cycle through tabs (demonstrates circular behavior)
    cout << "\nCycling through tabs (Ctrl+Tab behavior):\n";
    for (int i = 0; i < 5; i++) {
        Tab* tab = tabManager.getCurrentTab();
        cout << "  Tab ID: " << tab->id << "\n";
        tabManager.switchTab();
    }
    
    // ==============================================
    // DEMO 5: HTML Parsing with Tree + Stack
    // ==============================================
    printLine();
    cout << "\nDEMO 5: HTML Parsing (Tree + Stack)\n";
    printLine();
    
    string testHtml = "<h1>Test Page</h1><p>Hello World!</p><a>Link</a>";
    cout << "Parsing HTML: " << testHtml << "\n\n";
    
    DOMNode* dom = htmlParser.parse(testHtml);
    cout << "DOM Tree:\n";
    htmlParser.printTree(dom, 0);
    delete dom;
    
    // ==============================================
    // DEMO 6: HTTP Client (Mock)
    // ==============================================
    printLine();
    cout << "\nDEMO 6: HTTP Client (Mock Internet)\n";
    printLine();
    
    cout << "Fetching google.com:\n";
    cout << httpClient.fetch("google.com") << "\n\n";
    
    cout << "Fetching unknown-site.com:\n";
    cout << httpClient.fetch("unknown-site.com") << "\n";
    
    // ==============================================
    // Summary
    // ==============================================
    printLine();
    cout << "\n✅ All DSA demonstrations completed successfully!\n";
    cout << "\n📊 Time Complexity Summary:\n";
    cout << "   Stack push/pop:        O(1)\n";
    cout << "   DLL append/prepend:    O(1)\n";
    cout << "   BST insert/search:     O(log n) average\n";
    cout << "   HashMap get/put:       O(1) average\n";
    cout << "   Circular List advance: O(1)\n";
    printLine();
    
    cout << "\nPress Enter to exit...";
    cin.get();
    
    return 0;
}
