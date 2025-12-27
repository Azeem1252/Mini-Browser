// Simple JSON helper for educational purposes
// In production, use nlohmann/json library

#ifndef SIMPLE_JSON_HPP
#define SIMPLE_JSON_HPP

#include <string>
#include <sstream>
#include <vector>
#include <map>

class JSON {
public:
    static std::string stringify(const std::map<std::string, std::string>& obj) {
        std::ostringstream oss;
        oss << "{";
        bool first = true;
        for (const auto& [key, value] : obj) {
            if (!first) oss << ",";
            oss << "\"" << key << "\":\"" << escapeString(value) << "\"";
            first = false;
        }
        oss << "}";
        return oss.str();
    }

    static std::string arrayOfStrings(const std::vector<std::string>& arr) {
        std::ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < arr.size(); i++) {
            oss << "\"" << escapeString(arr[i]) << "\"";
            if (i < arr.size() - 1) oss << ",";
        }
        oss << "]";
        return oss.str();
    }

private:
    static std::string escapeString(const std::string& s) {
        std::string result;
        for (char c : s) {
            if (c == '"') result += "\\\"";
            else if (c == '\\') result += "\\\\";
            else if (c == '\n') result += "\\n";
            else if (c == '\r') result += "\\r";
            else if (c == '\t') result += "\\t";
            else result += c;
        }
        return result;
    }
};

#endif
