#pragma once
/*
 * ==============================================
 * BROWSER NAVIGATION (Back/Forward)
 * ==============================================
 * 
 * What is it?
 *   Handles the Back and Forward buttons in a browser.
 *   Just like Chrome or Firefox!
 * 
 * How it works:
 *   - Uses TWO stacks: one for Back history, one for Forward history
 *   - When you visit a new page: current page goes to Back stack
 *   - When you go Back: current page goes to Forward stack
 *   - When you go Forward: current page goes to Back stack
 * 
 * Why use Stacks?
 *   - LIFO (Last In First Out) is perfect for "undo" behavior
 *   - O(1) for all operations (push, pop)
 */

#include "dsa/Stack.hpp"
#include <string>
#include <iostream>
#include <fstream>
#include <vector>

using namespace std;

class StackNavigation {
private:
    Stack<string> backStack;      // Pages you can go "Back" to
    Stack<string> forwardStack;   // Pages you can go "Forward" to
    string currentUrl;            // The page you're currently viewing

public:
    // Start with empty URL (no initial page)
    StackNavigation() : currentUrl("") {}

    // Navigate to a new URL
    void navigateTo(string url) {
        // CRITICAL: Skip if navigating to the same URL (prevents Back/Forward loop)
        if (url == currentUrl) {
            cout << "Skipping duplicate navigation to: " << url << endl;
            return;
        }

        // Save current page to back history (only if it's a real URL)
        if (!currentUrl.empty() && currentUrl != "home://" && currentUrl != "about:blank") {
            backStack.push(currentUrl);
        }
        
        // Move to the new page
        currentUrl = url;
        
        // Clear forward history (you can't go forward after new navigation)
        // This is how real browsers work!
        forwardStack.clear();
        
        cout << "Navigated to: " << url << endl;
    }

    // Go back to the previous page
    string goBack() {
        // Can't go back if there's no history
        if (backStack.isEmpty()) {
            return currentUrl;
        }
        
        // Save current page to forward history
        forwardStack.push(currentUrl);
        
        // Go to the previous page
        currentUrl = backStack.pop();
        
        return currentUrl;
    }

    // Go forward to the next page
    string goForward() {
        // Can't go forward if there's no forward history
        if (forwardStack.isEmpty()) {
            return currentUrl;
        }
        
        // Save current page to back history
        backStack.push(currentUrl);
        
        // Go to the forward page
        currentUrl = forwardStack.pop();
        
        return currentUrl;
    }

    // Get the current URL
    string getCurrentUrl() {
        return currentUrl;
    }

    // Check if Back button should be enabled
    bool canGoBack() { 
        return !backStack.isEmpty(); 
    }
    
    // Check if Forward button should be enabled
    bool canGoForward() { 
        return !forwardStack.isEmpty(); 
    }

    // Persistence: Save stacks to a unique file for this tab
    void saveToFile(string filename) {
        ofstream file(filename);
        if (!file.is_open()) return;

        file << currentUrl << endl;
        
        // Save back history (oldest first for reconstruction)
        vector<string> back;
        while (!backStack.isEmpty()) back.push_back(backStack.pop());
        for (int i = back.size() - 1; i >= 0; i--) {
            file << "B|" << back[i] << endl;
            backStack.push(back[i]); // Restore stack
        }

        // Save forward history
        vector<string> fwd;
        while (!forwardStack.isEmpty()) fwd.push_back(forwardStack.pop());
        for (int i = fwd.size() - 1; i >= 0; i--) {
            file << "F|" << fwd[i] << endl;
            forwardStack.push(fwd[i]); // Restore stack
        }
        file.close();
    }

    void loadFromFile(string filename) {
        ifstream file(filename);
        if (!file.is_open()) return;

        backStack.clear();
        forwardStack.clear();
        
        string line;
        if (getline(file, line)) currentUrl = line;

        while (getline(file, line)) {
            if (line.substr(0, 2) == "B|") {
                backStack.push(line.substr(2));
            } else if (line.substr(0, 2) == "F|") {
                forwardStack.push(line.substr(2));
            }
        }
        file.close();
    }
};
