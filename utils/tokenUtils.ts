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
      if (__DEV__) {
        console.warn('Invalid JWT token format - expected 3 parts, got:', parts.length);
      }
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
      if (__DEV__) {
        console.warn('Failed to decode token payload:', decodeError);
      }
      return null;
    }

    const payloadObj = JSON.parse(decodedPayload);

    if (__DEV__) {
      console.log('🔍 Token payload decoded:', {
        hasUserId: !!payloadObj.userId,
        hasId: !!payloadObj.id,
        hasSub: !!payloadObj.sub,
        payloadKeys: Object.keys(payloadObj),
      });
    }

    // Check for user ID in common JWT payload fields
    const userId = payloadObj.userId || payloadObj.id || payloadObj.user_id || payloadObj.sub;
    
    if (userId) {
      const numUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
      if (!isNaN(numUserId)) {
        if (__DEV__) {
          console.log('✅ User ID extracted from token:', numUserId, 'from field:', 
            payloadObj.userId ? 'userId' : 
            payloadObj.id ? 'id' : 
            payloadObj.user_id ? 'user_id' : 'sub');
        }
        return numUserId;
      }
    }

    if (__DEV__) {
      console.warn('⚠️ No user ID found in token payload. Available fields:', Object.keys(payloadObj));
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to extract user ID from token:', error);
    }
    return null;
  }
}
