interface GamePlayEvent {
  userId: number;
  gameMode: string;
  duration: number;
  score: number;
  won: boolean;
  timestamp: string;
}

interface UserActionEvent {
  userId: number;
  action: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: (GamePlayEvent | UserActionEvent)[] = [];

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  trackGamePlay(event: GamePlayEvent): void {
    this.events.push(event);
    console.log('[Analytics] Game play tracked:', event);
  }

  trackUserAction(event: UserActionEvent): void {
    this.events.push(event);
    console.log('[Analytics] User action tracked:', event);
  }

  getUserAnalytics(userId: number) {
    const userEvents = this.events.filter(
      e => 'userId' in e && e.userId === userId
    );
    return {
      totalEvents: userEvents.length,
      events: userEvents,
    };
  }

  clearAnalytics(): void {
    this.events = [];
  }
}

export const analytics = AnalyticsService.getInstance();

