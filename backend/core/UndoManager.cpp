#include "Command.hpp"
#include <vector>

using namespace std;

class UndoManager {
private:
    vector<Command*> history;
    int currentIndex; // Pointer to current state (starts at -1)

public:
    UndoManager() : currentIndex(-1) {}

    ~UndoManager() {
        for (auto cmd : history) delete cmd;
    }

    void executeCommand(Command* cmd) {
        // Clear redo history if we're not at the end
        if (currentIndex < (int)history.size() - 1) {
            for (int i = currentIndex + 1; i < (int)history.size(); i++) {
                delete history[i];
            }
            history.erase(history.begin() + currentIndex + 1, history.end());
        }

        cmd->execute();
        history.push_back(cmd);
        currentIndex++;
        
        cout << "[UndoManager] Executed: " << cmd->getName() << endl;
    }

    void undo() {
        if (currentIndex < 0) {
            cout << "[UndoManager] Nothing to undo!" << endl;
            return;
        }

        history[currentIndex]->undo();
        currentIndex--;
        cout << "[UndoManager] Undid action. Current index: " << currentIndex << endl;
    }

    void redo() {
        if (currentIndex >= (int)history.size() - 1) {
            cout << "[UndoManager] Nothing to redo!" << endl;
            return;
        }

        currentIndex++;
        history[currentIndex]->execute();
        cout << "[UndoManager] Redid: " << history[currentIndex]->getName() << endl;
    }
};
