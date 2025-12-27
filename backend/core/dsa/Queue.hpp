#ifndef QUEUE_HPP
#define QUEUE_HPP

#include <stdexcept>

using namespace std;

template <typename T>
class Queue {
private:
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(val), next(nullptr) {}
    };
    Node *front, *rear;
    int queueSize;

public:
    Queue() : front(nullptr), rear(nullptr), queueSize(0) {}
    ~Queue() { while (!isEmpty()) dequeue(); }
    void enqueue(T val) {
        Node* newNode = new Node(val);
        if (rear == nullptr) {
            front = rear = newNode;
        } else {
            rear->next = newNode;
            rear = newNode;
        }
        queueSize++;
    }
    T dequeue() {
        if (isEmpty()) throw runtime_error("Queue Underflow");
        Node* temp = front;
        T val = temp->data;
        front = front->next;
        if (front == nullptr) rear = nullptr;
        delete temp;
        queueSize--;
        return val;
    }
    bool isEmpty() const { return front == nullptr; }
    int size() const { return queueSize; }
};

#endif
