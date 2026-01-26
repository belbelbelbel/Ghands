/**
 * Utility functions for working with JWT tokens
 */

/**
 * Extract user ID from JWT token payload
 * JWT tokens have format: header.payload.signature
 * We decode the payload (base64) to get user info
 */
export function extractUserIdFromToken(token: string): number | null {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Token might be UUID format, not JWT - this is valid, just return null
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    
    // Use base64 decoding (React Native compatible)
    let decodedPayload: string;
    try {
      // Try using atob if available (web/Node.js)
      if (typeof atob !== 'undefined') {
        decodedPayload = atob(paddedPayload);
      } else {
        // React Native: Use manual base64 decode
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        let i = 0;
        while (i < paddedPayload.length) {
          const encoded1 = base64Chars.indexOf(paddedPayload.charAt(i++));
          const encoded2 = base64Chars.indexOf(paddedPayload.charAt(i++));
          const encoded3 = base64Chars.indexOf(paddedPayload.charAt(i++));
          const encoded4 = base64Chars.indexOf(paddedPayload.charAt(i++));
          
          const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
          
          if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 16) & 255);
          if (encoded4 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
          if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
        }
        decodedPayload = result;
      }
    } catch (decodeError) {
      // Token might not be JWT format (could be UUID) - silently return null
      return null;
    }

    const payloadObj = JSON.parse(decodedPayload);

    // Removed verbose token logging

    // Check for user ID in common JWT payload fields
    const userId = payloadObj.userId || payloadObj.id || payloadObj.user_id || payloadObj.sub;
    
    if (userId) {
      const numUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
      if (!isNaN(numUserId)) {
        return numUserId;
      }
    }
    return null;
  } catch (error) {
    // Token might not be JWT format - silently return null
    return null;
  }
}
