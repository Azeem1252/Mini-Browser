#ifndef COMMAND_HPP
#define COMMAND_HPP

#include <string>
#include <iostream>

using namespace std;

// Forward declaration of BrowserEngine or managers if needed
// For now, let's assume commands will take necessary pointers

#include "TabManagerDoublyLinkedList.cpp"

class Command {
public:
    virtual ~Command() {}
    virtual void execute() = 0;
    virtual void undo() = 0;
    virtual string getName() const = 0;
};

class OpenTabCommand : public Command {
private:
    TabManager* tabManager;
    int tabId;
public:
    OpenTabCommand(TabManager* tm) : tabManager(tm), tabId(-1) {}
    void execute() override {
        tabManager->createNewTab();
        tabId = tabManager->getCurrentTab()->id;
    }
    void undo() override {
        // Simple undo for opening a tab: close it
        // This would need a way to close by ID
        tabManager->closeCurrentTab(); // Stub: assumes current is the one we opened
    }
    string getName() const override { return "Open Tab"; }
};

struct ClosedTabData {
    int id;
    string title;
    string url;
};

class CloseTabCommand : public Command {
private:
    TabManager* tabManager;
    ClosedTabData data;
public:

    CloseTabCommand(TabManager* tm, int id, string title, string url) 
        : tabManager(tm) {
        data.id = id;
        data.title = title;
        data.url = url;
    }
    void execute() override {
        tabManager->closeTabById(data.id);
    }
    void undo() override {
        tabManager->restoreTab(data.id, data.title, data.url);
    }
    string getName() const override { return "Close Tab (Undone restores it!)"; }
};

#endif
