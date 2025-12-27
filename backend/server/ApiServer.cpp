/*
 * ==============================================
 * BROWSER ENGINE API SERVER
 * ==============================================
 */

#include "httplib.h"
#include "json.hpp"
#include "../network/HttpClient.cpp"
#include "../core/TabManagerDoublyLinkedList.cpp"
#include "../core/BookmarkBST.cpp"
#include "../core/HistoryDoublyLinkedList.cpp"
#include "../parser/HTMLParser.cpp"
#include "../parser/DOMSerializer.hpp"
#include "../core/dsa/PriorityQueue.hpp"
#include "../core/dsa/Queue.hpp"
#include "../core/Command.hpp"
#include "../core/UndoManager.cpp"
#include <iostream>
#include <fstream>
#include <ctime>
#include <regex>
#include <mutex>

using namespace std;

// ==============================================
// DOWNLOAD STRUTURE
// ==============================================
struct DownloadEntry {
    string id;
    string filename;
    string url;
    string status;
    long long timestamp;

    bool operator==(const DownloadEntry& other) const {
        return id == other.id;
    }
};

// ==============================================
// BROWSER ENGINE CLASS
// ==============================================

class BrowserEngine {
private:
    TabManager tabManager;
    BookmarkManager bookmarkManager;
    HistoryManager historyManager;
    HttpClient httpClient;
    HTMLParser htmlParser;
    Queue<DownloadEntry> pendingQueue;         // Standard Queue (FIFO)
    PriorityQueue<DownloadEntry> priorityQueue; // Priority Queue (Heap)
    vector<DownloadEntry> downloadHistory;
    string activeDownloadId;                    // Track current active download (serial)
    UndoManager undoManager;
    mutable mutex engineMutex;

public:
    BrowserEngine() : activeDownloadId("") {
        loadHistoryFromFile();
        loadBookmarksFromFile();
        tabManager.loadSession();
    }

    ~BrowserEngine() {
        tabManager.saveSession();
        saveHistoryToFile();
        saveBookmarksToFile();
    }

    string addDownload(string id, string filename, string url) {
        lock_guard<mutex> lock(engineMutex);
        cout << "[CORE] addDownload request: ID=" << id << " | File=" << filename << endl;
        DownloadEntry entry = {id, filename, url, "pending", (long long)time(nullptr)};
        downloadHistory.push_back(entry);

        if (activeDownloadId.empty()) {
            activeDownloadId = id;
            cout << "[CORE] Setting activeDownloadId=" << id << " (Slot free)" << endl;
            // Update history status to downloading
            for (auto& h : downloadHistory) if (h.id == id) h.status = "downloading";
            return "{\"action\":\"start\"}";
        } else {
            cout << "[CORE] Quened ID=" << id << " (Slot busy by " << activeDownloadId << ")" << endl;
            pendingQueue.enqueue(entry);
            return "{\"action\":\"queue\"}";
        }
    }

    string completeDownload(string id) {
        lock_guard<mutex> lock(engineMutex);
        cout << "[CORE] completeDownload request for ID=" << id << endl;
        if (activeDownloadId == id) {
            activeDownloadId = "";
            cout << "[CORE] Freed activeDownloadId slot." << endl;
            
            // Sync status to history as completed (if not already failed)
            for (auto& h : downloadHistory) {
                if (h.id == id && h.status == "downloading") h.status = "completed";
            }

            // Pick next from Priority Heap first, then Pending Queue
            if (!priorityQueue.isEmpty()) {
                DownloadEntry next = priorityQueue.pop();
                activeDownloadId = next.id;
                for (auto& h : downloadHistory) if (h.id == next.id) h.status = "downloading";
                return "{\"nextId\":\"" + next.id + "\"}";
            } else if (!pendingQueue.isEmpty()) {
                DownloadEntry next = pendingQueue.dequeue();
                activeDownloadId = next.id;
                cout << "[CORE] Resuming next from Queue: ID=" << activeDownloadId << endl;
                for (auto& h : downloadHistory) if (h.id == next.id) h.status = "downloading";
                return "{\"nextId\":\"" + next.id + "\"}";
            }
            cout << "[CORE] No more downloads in queue." << endl;
        } else {
            cout << "[CORE] WARNING: completeDownload called for non-active ID: " << id << " (Current active: " << activeDownloadId << ")" << endl;
            // If the ID is in history but was pending, it might have been canceled
            for (auto& h : downloadHistory) {
                if (h.id == id) h.status = "cancelled";
            }
        }
        return "{\"nextId\":null}";
    }

    string prioritizeDownload(string id) {
        // Move from pendingQueue to priorityQueue
        auto allPending = pendingQueue.getAll();
        for (const auto& entry : allPending) {
            if (entry.id == id) {
                DownloadEntry prioritized = entry;
                prioritized.status = "priority";
                priorityQueue.push(prioritized, 10); // High priority
                pendingQueue.remove(entry);
                
                // Update history status
                for (auto& h : downloadHistory) {
                    if (h.id == id) h.status = "priority";
                }
                return "{\"success\":true}";
            }
        }
        return "{\"success\":false, \"message\":\"Not in pending queue\"}";
    }

    string getDownloadsJson() {
        ostringstream oss;
        oss << "{\"history\":[";
        for (size_t i = 0; i < downloadHistory.size(); i++) {
            oss << "{\"id\":\"" << downloadHistory[i].id 
                 << "\",\"filename\":\"" << downloadHistory[i].filename
                 << "\",\"url\":\"" << downloadHistory[i].url
                 << "\",\"status\":\"" << downloadHistory[i].status
                 << "\",\"timestamp\":" << downloadHistory[i].timestamp << "}";
            if (i < downloadHistory.size() - 1) oss << ",";
        }
        oss << "], \"pending_count\":" << pendingQueue.size() 
            << ", \"priority_count\":" << priorityQueue.size() << "}";
        return oss.str();
    }

    string clearDownloads() {
        lock_guard<mutex> lock(engineMutex);
        // Clear only completed/cancelled/failed downloads, keep active
        vector<DownloadEntry> newHistory;
        for (const auto& d : downloadHistory) {
            if (d.status == "downloading" || d.status == "pending" || d.status == "priority") {
                newHistory.push_back(d);
            }
        }
        downloadHistory = newHistory;
        cout << "[CORE] Cleared completed downloads. Remaining: " << downloadHistory.size() << endl;
        return "{\"success\":true}";
    }

    Tab* getTabById(int tabId) {
        if (tabId <= 0) return tabManager.getCurrentTab();
        int count = tabManager.getTabCount();
        for (int i = 0; i < count; i++) {
            Tab* t = tabManager.getCurrentTab();
            if (t->id == tabId) return t;
            tabManager.switchTab();
        }
        return nullptr;
    }

    string getTabStatus(int tabId) {
        Tab* t = getTabById(tabId);
        if (!t) return "{\"error\":\"Tab not found\"}";
        ostringstream oss;
        oss << "{\"url\":\"" << t->nav.getCurrentUrl() 
            << "\",\"canGoBack\":" << (t->nav.canGoBack() ? "true" : "false")
            << ",\"canGoForward\":" << (t->nav.canGoForward() ? "true" : "false")
            << ",\"tabId\":" << t->id << "}";
        return oss.str();
    }

    string navigateToUrl(string url, int tabId = 0) {
        Tab* currentTab = getTabById(tabId);
        if (!currentTab) return "{\"error\":\"No active tab\"}";
        currentTab->nav.navigateTo(url);
        historyManager.addEntry(url);
        saveHistoryToFile();
        ostringstream oss;
        oss << "{\"url\":\"" << url 
            << "\",\"canGoBack\":" << (currentTab->nav.canGoBack() ? "true" : "false")
            << ",\"canGoForward\":" << (currentTab->nav.canGoForward() ? "true" : "false")
            << "}";
        return oss.str();
    }

    string goBack(int tabId = 0) {
        Tab* currentTab = getTabById(tabId);
        if (currentTab) {
            bool canBackBefore = currentTab->nav.canGoBack();
            string url = currentTab->nav.goBack();
            ostringstream oss;
            oss << "{\"success\":" << (canBackBefore ? "true" : "false")
                << ",\"url\":\"" << url 
                << "\",\"canGoBack\":" << (currentTab->nav.canGoBack() ? "true" : "false")
                << ",\"canGoForward\":" << (currentTab->nav.canGoForward() ? "true" : "false")
                << "}";
            return oss.str();
        }
        return "{\"success\":false}";
    }

    string goForward(int tabId = 0) {
        Tab* currentTab = getTabById(tabId);
        if (currentTab) {
            bool canFwdBefore = currentTab->nav.canGoForward();
            string url = currentTab->nav.goForward();
            ostringstream oss;
            oss << "{\"success\":" << (canFwdBefore ? "true" : "false")
                << ",\"url\":\"" << url 
                << "\",\"canGoBack\":" << (currentTab->nav.canGoBack() ? "true" : "false")
                << ",\"canGoForward\":" << (currentTab->nav.canGoForward() ? "true" : "false")
                << "}";
            return oss.str();
        }
        return "{\"success\":false}";
    }

    string getHistoryJson() {
        auto history = historyManager.getHistory();
        ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < history.size(); i++) {
            oss << "\"" << history[i] << "\"";
            if (i < history.size() - 1) oss << ",";
        }
        oss << "]";
        return oss.str();
    }

    string addBookmark(string title, string url) {
        bookmarkManager.addBookmark(title, url);
        saveBookmarksToFile();
        return "{\"success\":true}";
    }
    string deleteBookmark(string title) {
        bookmarkManager.deleteBookmark(title);
        saveBookmarksToFile();
        return "{\"success\":true}";
    }

    void saveBookmarksToFile() {
        ofstream file("bookmarks.txt");
        auto all = bookmarkManager.getAllBookmarks();
        for (const auto& b : all) file << b.title << "|" << b.url << endl;
        file.close();
    }
    void loadBookmarksFromFile() {
        ifstream file("bookmarks.txt");
        string line;
        while (getline(file, line)) {
            size_t pos = line.find("|");
            if (pos != string::npos) bookmarkManager.addBookmark(line.substr(0, pos), line.substr(pos + 1));
        }
        file.close();
    }
    void saveHistoryToFile() {
        ofstream file("history.txt");
        auto h = historyManager.getHistory();
        for (const auto& url : h) file << url << endl;
        file.close();
    }
    void loadHistoryFromFile() {
        ifstream file("history.txt");
        string url;
        while (getline(file, url)) if (!url.empty()) historyManager.addEntry(url);
        file.close();
    }
    string getBookmarksJson() {
        auto bookmarks = bookmarkManager.getAllBookmarks();
        ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < bookmarks.size(); i++) {
            oss << "{\"title\":\"" << bookmarks[i].title << "\",\"url\":\"" << bookmarks[i].url << "\"}";
            if (i < bookmarks.size() - 1) oss << ",";
        }
        oss << "]";
        return oss.str();
    }

    // Command implementations would go here or in a separate file
    // For now, let's add basic undo support
    string undo() {
        undoManager.undo();
        tabManager.saveSession();
        return getTabsJson();
    }

    string getTabsJson() {
        ostringstream oss;
        oss << "[";
        auto current = tabManager.getHead();
        while (current) {
            Tab* t = current->data;
            oss << "{\"id\":" << t->id 
                << ",\"title\":\"" << t->title 
                << "\",\"url\":\"" << t->nav.getCurrentUrl() << "\"}";
            current = current->next;
            if (current) oss << ",";
        }
        oss << "]";
        return oss.str();
    }

    string createNewTab() { 
        undoManager.executeCommand(new OpenTabCommand(&tabManager));
        tabManager.saveSession();
        return "{\"success\":true}"; 
    }
    
    string closeTab(int tabId = 0) {
        Tab* t = getTabById(tabId);
        if (!t) return "{\"error\":\"Tab not found\"}";

        undoManager.executeCommand(new CloseTabCommand(&tabManager, t->id, t->title, t->nav.getCurrentUrl()));
        tabManager.saveSession();
        return "{\"success\":true}";
    }
    string switchTab() {
        tabManager.switchTab();
        Tab* t = tabManager.getCurrentTab();
        ostringstream oss;
        oss << "{\"url\":\"" << t->nav.getCurrentUrl() << "\",\"tabId\":" << t->id << "}";
        return oss.str();
    }
    void clearHistory() { 
        historyManager.clearHistory();
        saveHistoryToFile(); 
    }
};

// HELPER: Manual JSON regex extractor
string jsonValue(string body, string key) {
    regex r("\"" + key + "\"\\s*:\\s*\"?([^\",}]+)\"?");
    smatch m;
    if (regex_search(body, m, r)) {
        string val = m[1];
        if (!val.empty() && val.back() == '"') val.pop_back();
        return val;
    }
    return "";
}

void startServer() {
    using namespace httplib;
    Server server;
    BrowserEngine engine;

    server.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type"}
    });

    server.Post("/api/navigate", [&](const Request& req, Response& res) {
        string url = jsonValue(req.body, "url");
        string tId = jsonValue(req.body, "tabId");
        if (url.empty()) url = req.body;
        int tabId = tId.empty() ? 0 : stoi(tId);
        res.set_content(engine.navigateToUrl(url, tabId), "application/json");
    });

    server.Post("/api/back", [&](const Request& req, Response& res) {
        string tId = jsonValue(req.body, "tabId");
        res.set_content(engine.goBack(tId.empty() ? 0 : stoi(tId)), "application/json");
    });

    server.Post("/api/forward", [&](const Request& req, Response& res) {
        string tId = jsonValue(req.body, "tabId");
        res.set_content(engine.goForward(tId.empty() ? 0 : stoi(tId)), "application/json");
    });

    server.Post("/api/undo", [&](const Request& req, Response& res) {
        res.set_content(engine.undo(), "application/json");
    });

    server.Delete("/api/bookmarks", [&](const Request& req, Response& res) {
        string title = req.get_param_value("title");
        cout << "[API] Deleting Bookmark: " << title << endl;
        res.set_content(engine.deleteBookmark(title), "application/json");
    });

    server.Get("/api/tabs/status", [&](const Request& req, Response& res) {
        int tabId = req.has_param("tabId") ? stoi(req.get_param_value("tabId")) : 0;
        res.set_content(engine.getTabStatus(tabId), "application/json");
    });

    server.Get("/api/history", [&](const Request& req, Response& res) {
        res.set_content(engine.getHistoryJson(), "application/json");
    });

    server.Post("/api/history/clear", [&](const Request& req, Response& res) {
        engine.clearHistory();
        res.set_content("{\"success\":true}", "application/json");
    });

    server.Post("/api/bookmarks", [&](const Request& req, Response& res) {
        string title = jsonValue(req.body, "title");
        string url = jsonValue(req.body, "url");
        if (url.empty()) url = req.body;
        if (title.empty()) title = "New Bookmark";
        res.set_content(engine.addBookmark(title, url), "application/json");
    });

    server.Get("/api/bookmarks", [&](const Request& req, Response& res) {
        res.set_content(engine.getBookmarksJson(), "application/json");
    });

    server.Post("/api/downloads", [&](const Request& req, Response& res) {
        string id = jsonValue(req.body, "id");
        string filename = jsonValue(req.body, "filename");
        string url = jsonValue(req.body, "url");
        res.set_content(engine.addDownload(id, filename, url), "application/json");
    });

    server.Post("/api/downloads/complete", [&](const Request& req, Response& res) {
        string id = jsonValue(req.body, "id");
        res.set_content(engine.completeDownload(id), "application/json");
    });

    server.Post("/api/downloads/prioritize", [&](const Request& req, Response& res) {
        string id = jsonValue(req.body, "id");
        res.set_content(engine.prioritizeDownload(id), "application/json");
    });

    server.Get("/api/downloads", [&](const Request& req, Response& res) {
        res.set_content(engine.getDownloadsJson(), "application/json");
    });

    server.Post("/api/downloads/clear", [&](const Request& req, Response& res) {
        res.set_content(engine.clearDownloads(), "application/json");
    });

    server.Post("/api/tabs/new", [&](const Request& req, Response& res) {
        res.set_content(engine.createNewTab(), "application/json");
    });

    server.Post("/api/tabs/switch", [&](const Request& req, Response& res) {
        res.set_content(engine.switchTab(), "application/json");
    });

    server.set_pre_routing_handler([](const Request& req, Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method == "OPTIONS") {
            res.status = 204;
            return Server::HandlerResponse::Handled;
        }
        return Server::HandlerResponse::Unhandled;
    });

    server.Get("/api/health", [&](const Request& req, Response& res) {
        res.set_content("{\"status\":\"ok\"}", "application/json");
    });

    cout << "========================================" << endl;
    cout << "  MINI BROWSER ENGINE - API SERVER [v2.3]" << endl;
    cout << "========================================" << endl;
    cout << "Server: http://localhost:8080" << endl;
    cout << "Frontend: http://localhost:5173 (Vite)" << endl;
    cout << "Backend: C++ CORE [STRICT MODE ACTIVE]" << endl;
    cout << "========================================\n" << endl;

    server.listen("0.0.0.0", 8080);
}
