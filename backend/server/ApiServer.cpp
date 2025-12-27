/*
 * ==============================================
 * BROWSER ENGINE API SERVER
 * ==============================================
 */

#include "httplib.h"
#include "json.hpp"
#include "../network/HttpClient.cpp"
#include "../core/TabManagerCircularList.cpp"
#include "../core/BookmarkBST.cpp"
#include "../core/HistoryDoublyLinkedList.cpp"
#include "../parser/HTMLParser.cpp"
#include "../parser/DOMSerializer.hpp"
#include "../core/dsa/Queue.hpp"
#include <iostream>
#include <fstream>
#include <ctime>
#include <regex>

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
    Queue<DownloadEntry> downloadQueue;
    vector<DownloadEntry> downloadHistory;

public:
    BrowserEngine() {
        loadHistoryFromFile();
        loadBookmarksFromFile();
    }

    void addDownload(string id, string filename, string url) {
        DownloadEntry entry = {id, filename, url, "downloading", (long long)time(nullptr)};
        downloadQueue.enqueue(entry);
        downloadHistory.push_back(entry);
    }

    string getDownloadsJson() {
        ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < downloadHistory.size(); i++) {
            oss << "{\"id\":\"" << downloadHistory[i].id 
                 << "\",\"filename\":\"" << downloadHistory[i].filename
                 << "\",\"url\":\"" << downloadHistory[i].url
                 << "\",\"status\":\"" << downloadHistory[i].status
                 << "\",\"timestamp\":" << downloadHistory[i].timestamp << "}";
            if (i < downloadHistory.size() - 1) oss << ",";
        }
        oss << "]";
        return oss.str();
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
    string createNewTab() { tabManager.createNewTab(); return "{\"success\":true}"; }
    string switchTab() {
        tabManager.switchTab();
        Tab* t = tabManager.getCurrentTab();
        ostringstream oss;
        oss << "{\"url\":\"" << t->nav.getCurrentUrl() << "\",\"tabId\":" << t->id << "}";
        return oss.str();
    }
    void clearHistory() { saveHistoryToFile(); }
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
        engine.addDownload(id, filename, url);
        res.set_content("{\"success\":true}", "application/json");
    });

    server.Get("/api/downloads", [&](const Request& req, Response& res) {
        res.set_content(engine.getDownloadsJson(), "application/json");
    });

    server.Post("/api/tabs/new", [&](const Request& req, Response& res) {
        res.set_content(engine.createNewTab(), "application/json");
    });

    server.Post("/api/tabs/switch", [&](const Request& req, Response& res) {
        res.set_content(engine.switchTab(), "application/json");
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

    server.listen("localhost", 8080);
}
