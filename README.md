# Edge Redirector

![Edge Redirector Logo](images/icon128.png)

A Chrome extension that automatically redirects specific websites to open in Microsoft Edge browser.

## Overview

Edge Redirector allows you to seamlessly redirect websites from Chrome to Microsoft Edge. This is particularly useful for:

- Websites that are optimized for or require Edge
- Corporate environments where specific sites need to be accessed via Edge
- Users who prefer to keep certain websites in Edge while using Chrome as their primary browser

## Features

- 🔄 Automatic redirection from Chrome to Edge for specified domains
- 🌐 Support for wildcard domains (e.g., `*.example.com`)
- ⚙️ Easy configuration through a user-friendly popup interface
- 📋 Bulk import/export of domain lists
- 🔍 Advanced settings for redirect method customization

## Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now appear in your extensions list and toolbar

### From Chrome Web Store

I don't have a developer account on the Chrome Web Store yet because it requires a one-time fee. If you'd like to see this extension on the store, I accept donations to make it happen.

## Usage

### Quick Setup

1. Click the Edge Redirector icon in your Chrome toolbar
2. Toggle the extension on/off using the switch
3. Add domains you want to redirect to Edge in the input field
4. Use the format `example.com` or `*.example.com` for wildcards

### Advanced Configuration

For more detailed settings:

1. Right-click the extension icon and select "Options" or click "Advanced Settings" in the popup
2. From here you can:
   - Change the redirect method
   - Bulk import/export domain lists
   - Edit or remove existing domains

## How It Works

When you visit a website that matches a domain in your configured list, Edge Redirector:

1. Intercepts the navigation
2. Closes the tab in Chrome
3. Opens the same URL in Microsoft Edge using the appropriate protocol method

The extension uses the `microsoft-edge:` URL protocol to communicate with Edge, ensuring a smooth transition between browsers.

## Compatibility

- Fully compatible with Windows operating systems
- Basic compatibility with macOS (using protocol redirection)
- Limited support for Linux (manual URL copying may be required)

## Troubleshooting

**Edge doesn't open automatically:**

- Make sure Microsoft Edge is installed on your system
- Verify that Edge is set as the default handler for the `microsoft-edge:` protocol

**Redirection loop occurs:**

- Check that you don't have similar redirection extensions installed
- Verify that your domain patterns aren't too broad or conflicting

**Extension doesn't work on certain sites:**

- Some sites with complex URLs may not match correctly
- Try adding more specific domain patterns

## Privacy

Edge Redirector:

- Does not collect any user data
- Does not track your browsing history
- All configuration is stored locally in your browser

## Contributing

Contributions are welcome!

If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Claude 3.7 Sonnet for providing the majority of the codebase
- Microsoft Edge team for providing the protocol handler functionality
- Chrome Extension API documentation
