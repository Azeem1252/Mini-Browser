/*
 * ==============================================
 * MAIN ENTRY POINT
 * ==============================================
 * 
 * This is where the browser engine starts!
 * 
 * Project Overview:
 *   A mini web browser built with C++ to demonstrate
 *   data structures in a real-world application.
 * 
 * Data Structures Used:
 *   5. Queue           - Download manager
 *   6. Trie            - URL autocomplete
 *   7. Tree            - DOM (HTML structure)
 */

#include "server/ApiServer.cpp"
#include <iostream>

using namespace std;

int main() {
    // Print welcome banner
    cout << "\n";
    cout << "╔══════════════════════════════════════════════════════════╗\n";
    cout << "║   MINI WEB BROWSER ENGINE - SEMESTER FINAL PROJECT       ║\n";
    cout << "╚══════════════════════════════════════════════════════════╝\n";
    cout << "\n";
    
    // List the data structures
    cout << "📚 Data Structures Implemented:\n";
    cout << "   ✓ Stack (Navigation: Back/Forward)\n";
    cout << "   ✓ Doubly Linked List (Browsing History)\n";
    cout << "   ✓ Circular Linked List (Tab Management)\n";
    cout << "   ✓ Binary Search Tree (Bookmarks)\n";
    cout << "   ✓ Queue (Download Manager)\n";
    cout << "\n";
    
    // Explain the architecture
    cout << "🔧 Architecture:\n";
    cout << "   Layer 1: C++ Core (THIS BACKEND)\n";
    cout << "   Layer 2: REST API Server\n";
    cout << "   Layer 3: React UI (Frontend)\n";
    cout << "\n";
    
    cout << "🚀 Starting API Server...\n\n";

    // Start the server
    try {
        startServer();
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
        return 1;
    }

    return 0;
}
