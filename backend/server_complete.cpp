/*
 Complete Browser Engine Server
 All DSAs + Full API + cpp-httplib Integration
*/

#include "server/httplib.h"
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <stdexcept>

// ================== ALL DSA IMPLEMENTATIONS ==================

// Stack
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
    ~Stack() { while (!isEmpty()) pop(); }

    void push(T val) {
        Node* newNode = new Node(val);
        newNode->next = topNode;
        topNode = newNode;
    }

    T pop() {
        if (isEmpty()) throw std::runtime_error("Stack Underflow");
        Node* temp = topNode;
        T val = temp->data;
        topNode = topNode->next;
        delete temp;
        return val;
    }

    T peek() const {
        if (isEmpty()) throw std::runtime_error("Stack is empty");
        return topNode->data;
    }

    bool isEmpty() const { return topNode == nullptr; }
    void clear() { while (!isEmpty()) pop(); }
};

// Doubly Linked List
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

    void clear() {
        Node* current = head;
        while (current) {
            Node* temp = current;
            current = current->next;
            delete temp;
        }
        head = tail = nullptr;
    }

    std::vector<T> toVector() {
        std::vector<T> result;
        Node* curr = head;
        while (curr) {
            result.push_back(curr->data);
            curr = curr->next;
        }
        return result;
    }
};

// BST for Bookmarks
template <typename K, typename V>
class BST {
    struct Node {
        K key;
        V value;
        Node *left, *right;
        Node(K k, V v) : key(k), value(v), left(nullptr), right(nullptr) {}
    };

    Node* root;

    Node* insert(Node* node, K key, V value) {
        if (!node) return new Node(key, value);
        if (key < node->key) node->left = insert(node->left, key, value);
        else if (key > node->key) node->right = insert(node->right, key, value);
        else node->value = value;
        return node;
    }

    void inorder(Node* node, std::vector<V>& result) {
        if (!node) return;
        inorder(node->left, result);
        result.push_back(node->value);
        inorder(node->right, result);
    }

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

    std::vector<V> getAll() {
        std::vector<V> result;
        inorder(root, result);
        return result;
    }
};

// Circular Linked List for Tabs
template <typename T>
class CircularLinkedList {
public:
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(val), next(nullptr) {}
    };

private:
    Node* cursor;
    int listSize;

public:
    CircularLinkedList() : cursor(nullptr), listSize(0) {}
    
    ~CircularLinkedList() {
        if (!cursor) return;
        Node* curr = cursor->next;
        while (curr != cursor) {
            Node* temp = curr;
            curr = curr->next;
            delete temp;
        }
        delete cursor;
    }

    void add(T val) {
        Node* newNode = new Node(val);
        if (!cursor) {
            newNode->next = newNode;
            cursor = newNode;
        } else {
            newNode->next = cursor->next;
            cursor->next = newNode;
        }
        listSize++;
    }

    void advance() {
        if (cursor) cursor = cursor->next;
    }

    T& current() { return cursor->data; }
    int size() const { return listSize; }
};

// ================== BROWSER ENGINE COMPONENTS ==================

struct Bookmark {
    std::string title;
    std::string url;
};

class NavigationManager {
private:
    Stack<std::string> backStack;
    Stack<std::string> forwardStack;
    std::string currentUrl;

public:
    NavigationManager() : currentUrl("home://") {}

    void navigateTo(std::string url) {
        if (!currentUrl.empty()) {
            backStack.push(currentUrl);
        }
        currentUrl = url;
        forwardStack.clear();
    }

    std::string goBack() {
        if (backStack.isEmpty()) return currentUrl;
        forwardStack.push(currentUrl);
        currentUrl = backStack.pop();
        return currentUrl;
    }

    std::string goForward() {
        if (forwardStack.isEmpty()) return currentUrl;
        backStack.push(currentUrl);
        currentUrl = forwardStack.pop();
        return currentUrl;
    }

    std::string getCurrentUrl() { return currentUrl; }
};

#include <cstdio>
#include <memory>
#include <array>
#include <regex>

    class HttpClient {
    private:
        std::map<std::string, std::string> mockInternet;

        // Execute command and return output
        std::string exec(const char* cmd) {
            std::array<char, 128> buffer;
            std::string result;
            std::unique_ptr<FILE, decltype(&_pclose)> pipe(_popen(cmd, "r"), _pclose);
            if (!pipe) {
                return "Failed to open pipe";
            }
            while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
                result += buffer.data();
            }
            return result;
        }

    public:
        HttpClient() {
            mockInternet["home://"] = "<h1>🏠 Welcome to Mini Browser!</h1><p>This browser engine is powered by C++ with manual DSA implementations.</p><ul><li>Navigation: Stack</li><li>History: Doubly Linked List</li><li>Tabs: Circular Linked List</li><li>Bookmarks: Binary Search Tree</li></ul>";
        }

        std::string fetch(std::string url) {
            // Check mock internet first
            if (mockInternet.find(url) != mockInternet.end()) {
                return mockInternet[url];
            }

            // Real Internet Fetching via CURL
            std::cout << "🌐 Fetching real URL: " << url << "\n";
            
            // Basic security check (prevent command injection)
            if (url.find(";") != std::string::npos || url.find("|") != std::string::npos || url.find("&") != std::string::npos) {
                 return "<h1>Security Error</h1><p>Invalid characters in URL.</p>";
            }

            std::string command = "curl -L --max-time 5 -s \"" + url + "\"";
            std::string html = exec(command.c_str());

            if (html.empty()) {
                return "<h1>404 - Page Not Found / Timeout</h1><p>Could not fetch <code>" + url + "</code></p>";
            }

            // Inject <base> tag to fix relative links/images
            std::string baseTag = "<base href=\"" + url + "\">";
            size_t headPos = html.find("<head>");
            if (headPos != std::string::npos) {
                html.insert(headPos + 6, baseTag);
            } else {
                html = baseTag + html;
            }

            return html;
        }
    };

struct Tab {
    int id;
    std::string title;
    NavigationManager nav;
    
    Tab(int _id) : id(_id), title("New Tab") {}
};

class TabManager {
private:
    CircularLinkedList<Tab*> tabs;
    int nextTabId;

public:
    TabManager() : nextTabId(1) {
        createNewTab();
    }

    void createNewTab() {
        Tab* newTab = new Tab(nextTabId++);
        tabs.add(newTab);
    }

    void switchTab() {
        tabs.advance();
    }

    Tab* getCurrentTab() {
        if (tabs.size() == 0) return nullptr;
        return tabs.current();
    }

    int getTabCount() {
        return tabs.size();
    }
};

// ================== MAIN BROWSER ENGINE ==================

class BrowserEngine {
private:
    TabManager tabManager;
    BST<std::string, Bookmark> bookmarks;
    DoublyLinkedList<std::string> history;
    HttpClient httpClient;

public:
    BrowserEngine() {
        std::cout << "✓ Browser Engine initialized with all DSAs\n";
    }

    std::string navigateToUrl(std::string url) {
        Tab* tab = tabManager.getCurrentTab();
        if (!tab) return "{\"error\":\"No active tab\"}";

        tab->nav.navigateTo(url);
        history.append(url);

        std::string html = httpClient.fetch(url);

        std::ostringstream json;
        json << "{\"url\":\"" << url << "\",\"content\":\"";
        for (char c : html) {
            if (c == '"') json << "\\\"";
            else if (c == '\\') json << "\\\\";
            else if (c == '\n') json << "\\n";
            else json << c;
        }
        json << "\"}";
        return json.str();
    }

    std::string goBack() {
        Tab* tab = tabManager.getCurrentTab();
        if (!tab) return "{\"error\":\"No active tab\"}";

        std::string url = tab->nav.goBack();
        std::string html = httpClient.fetch(url);

        std::ostringstream json;
        json << "{\"url\":\"" << url << "\",\"content\":\"";
        for (char c : html) {
            if (c == '"') json << "\\\"";
            else if (c == '\\') json << "\\\\";
            else if (c == '\n') json << "\\n";
            else json << c;
        }
        json << "\"}";
        return json.str();
    }

    std::string goForward() {
        Tab* tab = tabManager.getCurrentTab();
        if (!tab) return "{\"error\":\"No active tab\"}";

        std::string url = tab->nav.goForward();
        std::string html = httpClient.fetch(url);

        std::ostringstream json;
        json << "{\"url\":\"" << url << "\",\"content\":\"";
        for (char c : html) {
            if (c == '"') json << "\\\"";
            else if (c == '\\') json << "\\\\";
            else if (c == '\n') json << "\\n";
            else json << c;
        }
        json << "\"}";
        return json.str();
    }

    std::string getHistory() {
        auto historyVec = history.toVector();
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < historyVec.size(); i++) {
            json << "\"" << historyVec[i] << "\"";
            if (i < historyVec.size() - 1) json << ",";
        }
        json << "]";
        return json.str();
    }

    std::string addBookmark(std::string title, std::string url) {
        bookmarks.insert(title.empty() ? url : title, {title, url});
        return "{\"success\":true}";
    }

    std::string getBookmarks() {
        auto allBookmarks = bookmarks.getAll();
        std::ostringstream json;
        json << "[";
        for (size_t i = 0; i < allBookmarks.size(); i++) {
            json << "{\"title\":\"" << allBookmarks[i].title 
                 << "\",\"url\":\"" << allBookmarks[i].url << "\"}";
            if (i < allBookmarks.size() - 1) json << ",";
        }
        json << "]";
        return json.str();
    }

    std::string createNewTab() {
        tabManager.createNewTab();
        return "{\"success\":true,\"tabCount\":" + std::to_string(tabManager.getTabCount()) + "}";
    }

    std::string switchTab() {
        tabManager.switchTab();
        Tab* tab = tabManager.getCurrentTab();
        std::string url = tab->nav.getCurrentUrl();
        return "{\"url\":\"" + url + "\"}";
    }
};

// ================== HTTP SERVER ==================

int main() {
    using namespace httplib;

    std::cout << "\n";
    std::cout << "╔══════════════════════════════════════════════════════════╗\n";
    std::cout << "║   MINI WEB BROWSER ENGINE - C++ BACKEND SERVER          ║\n";
    std::cout << "╚══════════════════════════════════════════════════════════╝\n";
    std::cout << "\n";
    std::cout << "📚 Data Structures Active:\n";
    std::cout << "   ✓ Stack (Navigation)\n";
    std::cout << "   ✓ Doubly Linked List (History)\n";
    std::cout << "   ✓ Circular Linked List (Tabs)\n";
    std::cout << "   ✓ Binary Search Tree (Bookmarks)\n";
    std::cout << "\n";

    Server svr;
    BrowserEngine engine;

    // Enable CORS for React frontend
    svr.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type"}
    });

    // Handle OPTIONS requests for CORS
    svr.Options(".*", [](const Request&, Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 200;
    });

    // API Endpoints
    svr.Post("/api/navigate", [&](const Request& req, Response& res) {
        std::string url = req.body;
        std::string result = engine.navigateToUrl(url);
        res.set_content(result, "application/json");
        std::cout << "→ Navigate to: " << url << "\n";
    });

    svr.Post("/api/back", [&](const Request& req, Response& res) {
        std::string result = engine.goBack();
        res.set_content(result, "application/json");
        std::cout << "← Back\n";
    });

    svr.Post("/api/forward", [&](const Request& req, Response& res) {
        std::string result = engine.goForward();
        res.set_content(result, "application/json");
        std::cout << "→ Forward\n";
    });

    svr.Get("/api/history", [&](const Request& req, Response& res) {
        std::string result = engine.getHistory();
        res.set_content(result, "application/json");
        std::cout << "📜 History requested\n";
    });

    svr.Post("/api/bookmarks", [&](const Request& req, Response& res) {
        std::string url = req.body;
        std::string result = engine.addBookmark("", url);
        res.set_content(result, "application/json");
        std::cout << "⭐ Bookmark added: " << url << "\n";
    });

    svr.Get("/api/bookmarks", [&](const Request& req, Response& res) {
        std::string result = engine.getBookmarks();
        res.set_content(result, "application/json");
        std::cout << "📑 Bookmarks requested\n";
    });

    svr.Post("/api/tabs/new", [&](const Request& req, Response& res) {
        std::string result = engine.createNewTab();
        res.set_content(result, "application/json");
        std::cout << "➕ New tab created\n";
    });

    svr.Post("/api/tabs/switch", [&](const Request& req, Response& res) {
        std::string result = engine.switchTab();
        res.set_content(result, "application/json");
        std::cout << "🔄 Tab switched\n";
    });

    std::cout << "========================================\n";
    std::cout << "🚀 Server starting on http://localhost:8080\n";
    std::cout << "📊 Frontend: http://localhost:3001\n";
    std::cout << "========================================\n\n";
    std::cout << "Waiting for connections...\n\n";

    svr.listen("0.0.0.0", 8080);

    return 0;
}
