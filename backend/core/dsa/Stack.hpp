#ifndef STACK_HPP
#define STACK_HPP

#include <stdexcept>

using namespace std;

template <typename T>
class Stack {
private:
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(val), next(nullptr) {}
    };
    Node* topNode;
    int stackSize;

public:
    Stack() : topNode(nullptr), stackSize(0) {}
    ~Stack() { clear(); }
    void push(T val) {
        Node* newNode = new Node(val);
        newNode->next = topNode;
        topNode = newNode;
        stackSize++;
    }
    T pop() {
        if (isEmpty()) throw runtime_error("Stack Underflow");
        Node* temp = topNode;
        T val = temp->data;
        topNode = topNode->next;
        delete temp;
        stackSize--;
        return val;
    }
    T peek() const {
        if (isEmpty()) throw runtime_error("Stack Empty");
        return topNode->data;
    }
    bool isEmpty() const { return topNode == nullptr; }
    int size() const { return stackSize; }
    void clear() { while (!isEmpty()) pop(); }
};

#endif
