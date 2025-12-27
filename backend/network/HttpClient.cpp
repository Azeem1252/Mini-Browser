/*
 * ==============================================
 * MOCK HTTP CLIENT
 * ==============================================
 * 
 * What is it?
 *   Simulates fetching web pages from the internet.
 *   In a real browser, this would make actual network requests.
 *   Here we use a simple dictionary of fake websites.
 * 
 * Why mock it?
 *   - No need for actual network in this demo
 *   - Shows the concept without complexity
 *   - Easy to test and debug
 */

#include <string>
#include <map>

using namespace std;

class HttpClient {
private:
    // Our "fake internet" - a map of URLs to their HTML content
    map<string, string> mockWebsites;

public:
    // Constructor: set up some fake websites
    HttpClient() {
        // Google's homepage
        mockWebsites["google.com"] = 
            "<h1>Google</h1>"
            "<p>Welcome to Google</p>"
            "<a href='search'>Search</a>";
        
        // GitHub's homepage
        mockWebsites["github.com"] = 
            "<h1>GitHub</h1>"
            "<p>Where the world builds software</p>"
            "<a>Repo</a>";
        
        // Bing's homepage
        mockWebsites["bing.com"] = 
            "<h1>Bing</h1>"
            "<p>Search better</p>";
        
        // Browser's home page
        mockWebsites["home://"] = 
            "<h1>Home</h1>"
            "<p>Welcome to your Mini Browser!</p>";
    }

    // Fetch the HTML content for a URL
    string fetch(string url) {
        // Check if we have this website
        if (mockWebsites.find(url) != mockWebsites.end()) {
            return mockWebsites[url];
        }
        
        // URL not found - return 404 page
        return "<h1>404 Page Not Found</h1>"
               "<p>The URL " + url + " does not exist in our mock internet.</p>";
    }
};
