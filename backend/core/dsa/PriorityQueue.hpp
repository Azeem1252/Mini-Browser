#ifndef PRIORITY_QUEUE_HPP
#define PRIORITY_QUEUE_HPP

#include <vector>
#include <stdexcept>
#include <algorithm>

using namespace std;

template <typename T>
class PriorityQueue {
private:
    struct Element {
        T data;
        int priority;

        bool operator<(const Element& other) const {
            return priority < other.priority; // Max-heap: higher priority first
        }
    };

    vector<Element> heap;

    void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap[index].priority > heap[parent].priority) {
                swap(heap[index], heap[parent]);
                index = parent;
            } else {
                break;
            }
        }
    }

    void heapifyDown(int index) {
        int size = heap.size();
        while (true) {
            int left = 2 * index + 1;
            int right = 2 * index + 2;
            int largest = index;

            if (left < size && heap[left].priority > heap[largest].priority) {
                largest = left;
            }
            if (right < size && heap[right].priority > heap[largest].priority) {
                largest = right;
            }

            if (largest != index) {
                swap(heap[index], heap[largest]);
                index = largest;
            } else {
                break;
            }
        }
    }

public:
    void push(T val, int priority) {
        heap.push_back({val, priority});
        heapifyUp(heap.size() - 1);
    }

    T pop() {
        if (isEmpty()) throw runtime_error("Priority Queue Empty");
        
        T result = heap[0].data;
        heap[0] = heap.back();
        heap.pop_back();
        
        if (!heap.empty()) {
            heapifyDown(0);
        }
        
        return result;
    }

    T peek() const {
        if (isEmpty()) throw runtime_error("Priority Queue Empty");
        return heap[0].data;
    }

    bool isEmpty() const { return heap.empty(); }
    int size() const { return heap.size(); }
};

#endif
