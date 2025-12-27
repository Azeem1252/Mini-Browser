/*
 * ==============================================
 * BOOKMARK MANAGER
 * ==============================================
 * 
 * What is it?
 *   Manages browser bookmarks using a Binary Search Tree.
 *   Bookmarks are automatically sorted alphabetically by title.
 * 
 * Why use a BST?
 *   - Fast search: O(log n) to find a bookmark
 *   - Fast insert: O(log n) to add new bookmark  
 *   - Auto-sorted: In-order traversal gives alphabetical order
 */

#include "dsa/BST.hpp"
#include <string>
#include <vector>

using namespace std;

// Represents a single bookmark with a title and URL
struct Bookmark {
    string title;  // Display name (e.g., "Google")
    string url;    // Web address (e.g., "google.com")
};

class BookmarkManager {
private:
    // The tree uses 'title' as the key for alphabetical sorting
    BST<string, Bookmark> bookmarkTree;

public:
    // Add a new bookmark
    // If title already exists, it will be updated with new URL
    void addBookmark(string title, string url) {
        Bookmark newBookmark = {title, url};
        bookmarkTree.insert(title, newBookmark);
    }

    // Get all bookmarks in alphabetical order by title
    // Uses in-order traversal of the BST
    vector<Bookmark> getAllBookmarks() {
        return bookmarkTree.getAll();
    }

    // Search for a specific bookmark by title
    // Returns nullptr if not found
    Bookmark* findBookmark(string title) {
        return bookmarkTree.search(title);
    }
};
