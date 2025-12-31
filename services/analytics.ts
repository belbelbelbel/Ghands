/**
 * Analytics service for tracking user events and app usage
 * Supports multiple analytics providers (can be extended)
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
}

interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private enabled: boolean;
  private userId: string | null = null;
  private providers: Array<(event: AnalyticsEvent) => void> = [];

  constructor() {
    this.enabled = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === 'true';
    this.setupProviders();
  }

  /**
   * Setup analytics providers
   * Add your analytics SDK initialization here (e.g., Firebase Analytics, Mixpanel, etc.)
   */
  private setupProviders() {
    if (!this.enabled) {
      return;
    }

    // Example: Firebase Analytics
    // import analytics from '@react-native-firebase/analytics';
    // this.providers.push((event) => {
    //   analytics().logEvent(event.name, event.properties);
    // });

    // Example: Custom analytics endpoint
    this.providers.push(async (event) => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.ghands.com';
        await fetch(`${apiUrl}/analytics/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
            platform: 'mobile',
          }),
        });
      } catch (error) {
        if (__DEV__) {
          console.log('Analytics event:', event);
        }
      }
    });
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      userId: this.userId || undefined,
    };

    this.providers.forEach((provider) => {
      try {
        provider(event);
      } catch (error) {
        if (__DEV__) {
          console.error('Error tracking event:', error);
        }
      }
    });
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: AnalyticsUser) {
    if (!this.enabled) {
      return;
    }

    this.userId = userId;

    // Send identify event to providers
    this.providers.forEach((provider) => {
      try {
        provider({
          name: 'user_identified',
          properties: traits,
          userId,
        });
      } catch (error) {
        if (__DEV__) {
          console.error('Error identifying user:', error);
        }
      }
    });
  }

  /**
   * Track screen view
   */
  screen(screenName: string, properties?: Record<string, any>) {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  action(actionName: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action: actionName,
      ...properties,
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Reset user identification (on logout)
   */
  reset() {
    this.userId = null;
  }
}

export const analytics = new AnalyticsService();

