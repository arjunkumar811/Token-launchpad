# Token Persistence Implementation

This document explains how tokens are persisted between page refreshes in the Token Launchpad application.

## How Token Data Is Stored

1. **LocalStorage**: The application uses the browser's localStorage API to store token data as a JSON string. This allows tokens to persist even when the browser is closed and reopened.

2. **Token Saving**: When a new token is created, its data is added to an array of tokens in localStorage:
   ```javascript
   const savedTokens = JSON.parse(localStorage.getItem('createdTokens') || '[]');
   savedTokens.push(tokenData);
   localStorage.setItem('createdTokens', JSON.stringify(savedTokens));
   ```

3. **Token Loading**: When the application starts, it automatically loads all saved tokens from localStorage:
   ```javascript
   useEffect(() => {
     const savedTokens = JSON.parse(localStorage.getItem('createdTokens') || '[]');
     setAllTokens(savedTokens);
     // Select most recent token...
   }, []);
   ```

## Key Components

1. **TokenLaunchpad Component**: 
   - Manages the main state for tokens
   - Loads tokens from localStorage on mount
   - Saves new tokens to localStorage

2. **TokenSelector Component**:
   - Displays a list of all saved tokens
   - Allows switching between tokens
   - Provides functionality to remove tokens from the list

3. **ErrorBoundary Component**:
   - Catches rendering errors to prevent crashes
   - Shows a helpful error message if something goes wrong

## Data Flow

1. When the application loads:
   - The useEffect hook in TokenLaunchpad loads tokens from localStorage
   - The most recent token (by timestamp) is selected automatically
   - The UI switches to the "manage" view if tokens are found

2. When creating a new token:
   - The token data is saved to localStorage
   - The token is added to the allTokens state array
   - The UI automatically switches to the newly created token

3. When removing a token:
   - The token is filtered out from the localStorage array
   - If the removed token was the current selection, another token is selected automatically
   - If no tokens remain, the UI switches to the "create" view

## Potential Improvements

- Add a cloud-based backup for token data
- Implement import/export functionality for token data
- Add search functionality for users with many tokens
- Implement token grouping or categorization