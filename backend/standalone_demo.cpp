/*
 * ==============================================
 * STANDALONE DEMO (All DSAs in One File)
 * ==============================================
 * 
 * This file contains ALL data structures and demos in a single file.
 * No external dependencies needed - just compile and run!
 * 
 * Great for:
 *   - Understanding how each DSA works
 *   - Quick testing without complex build setup
 *   - Learning C++ data structures
 */

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <stdexcept>

using namespace std;


// ╔══════════════════════════════════════════════════════════╗
// ║  DATA STRUCTURE 1: STACK                                 ║
// ╚══════════════════════════════════════════════════════════╝

template <typename T>
class Stack {
private:
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(val), next(nullptr) {}
    };
    Node* topNode;

public:
    Stack() : topNode(nullptr) {}
    
    ~Stack() {
        while (!isEmpty()) pop();
    }

    // Add item to top
    void push(T val) {
        Node* newNode = new Node(val);
        newNode->next = topNode;
        topNode = newNode;
    }

    // Remove and return top item
    T pop() {
        if (isEmpty()) throw runtime_error("Stack Underflow");
        Node* temp = topNode;
        T val = temp->data;
        topNode = topNode->next;
        delete temp;
        return val;
    }

    // Look at top without removing
    T peek() const {
        if (isEmpty()) throw runtime_error("Stack is empty");
        return topNode->data;
    }

    bool isEmpty() const { return topNode == nullptr; }

    void clear() { while (!isEmpty()) pop(); }
};


// ╔══════════════════════════════════════════════════════════╗
// ║  DATA STRUCTURE 2: DOUBLY LINKED LIST                    ║
// ╚══════════════════════════════════════════════════════════╝

template <typename T>
class DoublyLinkedList {
public:
    struct Node {
        T data;
        Node* next;
        Node* prev;
        Node(T val) : data(val), next(nullptr), prev(nullptr) {}
    };

private:
    Node* head;
    Node* tail;

public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}
    
    ~DoublyLinkedList() { clear(); }

    // Add at end
    void append(T val) {
        Node* newNode = new Node(val);
        if (!head) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            newNode->prev = tail;
            tail = newNode;
        }
    }

    // Delete all nodes
    void clear() {
        Node* current = head;
        while (current) {
            Node* temp = current;
            current = current->next;
            delete temp;
        }
        head = tail = nullptr;
    }

    Node* getHead() const { return head; }
    
    // Convert to vector for easy display
    vector<T> toVector() {
        vector<T> result;
        Node* curr = head;
        while (curr) {
            result.push_back(curr->data);
            curr = curr->next;
        }
        return result;
    }
};


// ╔══════════════════════════════════════════════════════════╗
// ║  DATA STRUCTURE 3: BINARY SEARCH TREE                    ║
// ╚══════════════════════════════════════════════════════════╝

template <typename K, typename V>
class BST {
    struct Node {
        K key;
        V value;
        Node *left, *right;
        Node(K k, V v) : key(k), value(v), left(nullptr), right(nullptr) {}
    };

    Node* root;

    // Recursive insert
    Node* insert(Node* node, K key, V value) {
        if (!node) return new Node(key, value);
        if (key < node->key) node->left = insert(node->left, key, value);
        else if (key > node->key) node->right = insert(node->right, key, value);
        else node->value = value;  // Update existing
        return node;
    }

    // In-order traversal (gives sorted order)
    void inorder(Node* node, vector<V>& result) {
        if (!node) return;
        inorder(node->left, result);
        result.push_back(node->value);
        inorder(node->right, result);
    }

    // Clean up memory
    void clear(Node* node) {
        if (!node) return;
        clear(node->left);
        clear(node->right);
        delete node;
    }

public:
    BST() : root(nullptr) {}
    ~BST() { clear(root); }

    void insert(K key, V value) { root = insert(root, key, value); }

    vector<V> getAll() {
        vector<V> result;
        inorder(root, result);
        return result;
    }
};


// ╔══════════════════════════════════════════════════════════╗
// ║  APPLICATION: NAVIGATION MANAGER                         ║
// ╚══════════════════════════════════════════════════════════╝

struct Bookmark {
    string title;
    string url;
};

class NavigationManager {
private:
    Stack<string> backStack;
    Stack<string> forwardStack;
    string currentUrl;

public:
    NavigationManager() : currentUrl("home://") {}

    void navigateTo(string url) {
        if (!currentUrl.empty()) backStack.push(currentUrl);
        currentUrl = url;
        forwardStack.clear();
    }

    string goBack() {
        if (backStack.isEmpty()) return currentUrl;
        forwardStack.push(currentUrl);
        currentUrl = backStack.pop();
        return currentUrl;
    }

    string goForward() {
        if (forwardStack.isEmpty()) return currentUrl;
        backStack.push(currentUrl);
        currentUrl = forwardStack.pop();
        return currentUrl;
    }

    string getCurrentUrl() { return currentUrl; }
};


// ╔══════════════════════════════════════════════════════════╗
// ║  MAIN DEMO                                               ║
// ╚══════════════════════════════════════════════════════════╝

void printLine() {
    cout << "=====================================\n";
}

int main() {
    cout << "\n";
    cout << "╔══════════════════════════════════════════════════════════╗\n";
    cout << "║   MINI WEB BROWSER ENGINE - DSA DEMONSTRATION            ║\n";
    cout << "╚══════════════════════════════════════════════════════════╝\n";
    cout << "\n";
    cout << "📚 Data Structures Being Demonstrated:\n";
    cout << "   ✓ Stack (Navigation: Back/Forward)\n";
    cout << "   ✓ Doubly Linked List (Browsing History)\n";
    cout << "   ✓ Binary Search Tree (Bookmarks)\n";
    cout << "\n";
    
    // ===== DEMO 1: Navigation with Stack =====
    printLine();
    cout << "DEMO 1: Navigation (Stack)\n";
    printLine();
    
    NavigationManager nav;
    cout << "Starting at: " << nav.getCurrentUrl() << "\n\n";
    
    nav.navigateTo("google.com");
    cout << "Navigate to: google.com\n";
    
    nav.navigateTo("github.com");
    cout << "Navigate to: github.com\n";
    
    nav.navigateTo("bing.com");
    cout << "Navigate to: bing.com\n";
    
    cout << "\nCurrent URL: " << nav.getCurrentUrl() << "\n";
    
    cout << "\n--- Going BACK ---\n";
    cout << "Back to: " << nav.goBack() << "\n";
    cout << "Back to: " << nav.goBack() << "\n";
    
    cout << "\n--- Going FORWARD ---\n";
    cout << "Forward to: " << nav.goForward() << "\n";
    
    // ===== DEMO 2: History with Doubly Linked List =====
    printLine();
    cout << "\nDEMO 2: Browsing History (Doubly Linked List)\n";
    printLine();
    
    DoublyLinkedList<string> history;
    history.append("home://");
    history.append("google.com");
    history.append("github.com");
    history.append("bing.com");
    history.append("stackoverflow.com");
    
    auto historyVec = history.toVector();
    cout << "Browsing History (" << historyVec.size() << " entries):\n";
    for (const auto& url : historyVec) {
        cout << "  🕒 " << url << "\n";
    }
    
    // ===== DEMO 3: Bookmarks with BST =====
    printLine();
    cout << "\nDEMO 3: Bookmarks (Binary Search Tree)\n";
    printLine();
    
    BST<string, Bookmark> bookmarks;
    bookmarks.insert("Google", {"Google", "google.com"});
    bookmarks.insert("GitHub", {"GitHub", "github.com"});
    bookmarks.insert("Bing", {"Bing", "bing.com"});
    bookmarks.insert("Stack Overflow", {"Stack Overflow", "stackoverflow.com"});
    
    auto allBookmarks = bookmarks.getAll();
    cout << "Bookmarks (Sorted Alphabetically):\n";
    for (const auto& bm : allBookmarks) {
        cout << "  ⭐ " << bm.title << " → " << bm.url << "\n";
    }
    
    // ===== Summary =====
    printLine();
    cout << "\n✅ All DSA Demonstrations Completed!\n";
    cout << "\n📊 Time Complexity Summary:\n";
    cout << "   Stack push/pop:     O(1)\n";
    cout << "   DLL append:         O(1)\n";
    cout << "   DLL traverse:       O(n)\n";
    cout << "   BST insert/search:  O(log n) average\n";
    printLine();
    
    cout << "\n🎓 Key Points:\n";
    cout << "   • All DSAs implemented manually (no STL containers)\n";
    cout << "   • Clean, readable code structure\n";
    cout << "   • Real-world browser use cases\n";
    printLine();
    
    cout << "\nPress Enter to exit...";
    cin.get();
    
    return 0;
}
