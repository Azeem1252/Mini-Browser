#ifndef QUEUE_HPP
#define QUEUE_HPP

#include "DoublyLinkedList.hpp"
#include <stdexcept>

using namespace std;

template <typename T>
class Queue {
private:
    DoublyLinkedList<T> list;

public:
    void enqueue(T val) {
        list.append(val);
    }

    T dequeue() {
        if (isEmpty()) throw runtime_error("Queue Empty");
        T val = list.getHead()->data;
        list.removeNode(list.getHead());
        return val;
    }

    T peek() const {
        if (isEmpty()) throw runtime_error("Queue Empty");
        return list.getHead()->data;
    }

    bool isEmpty() const {
        return list.isEmpty();
    }

    int size() const {
        return list.size();
    }
    
    // Helper to see all elements (for API)
    vector<T> getAll() const {
        vector<T> result;
        auto current = list.getHead();
        while (current) {
            result.push_back(current->data);
            current = current->next;
        }
        return result;
    }

    // Ability to remove specific item if needed (though not standard queue)
    bool remove(T val) {
        auto current = list.getHead();
        while (current) {
            if (current->data == val) {
                list.removeNode(current);
                return true;
            }
            current = current->next;
        }
        return false;
    }
};

#endif
