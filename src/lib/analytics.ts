import posthog from 'posthog-js';

// Initialize PostHog
export const initPostHog = () => {
  posthog.init('phx_iPlU8wLVzmvZSLI14aUICwijlP2WcrtkzO7FrXVjE6VbUOI', {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
};

// Identify user (call after login/signup)
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

// Reset user (call on logout)
export const resetAnalytics = () => {
  posthog.reset();
};

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Predefined event helpers
export const analytics = {
  // Auth events
  userSignedUp: (method: 'email' | 'google', plan: string, isEmployee: boolean) => {
    trackEvent('user_signed_up', { method, plan, is_employee: isEmployee });
  },
  
  userLoggedIn: (method: 'email' | 'google') => {
    trackEvent('user_logged_in', { method });
  },
  
  // TTFV (Time to First Value) events
  firstCarAdded: () => {
    trackEvent('first_car_added');
  },
  
  carAdded: (carId: string) => {
    trackEvent('car_added', { car_id: carId });
  },
  
  firstImageEdited: () => {
    trackEvent('first_image_edited');
  },
  
  imageEdited: (carId: string, count: number = 1) => {
    trackEvent('image_edited', { car_id: carId, count });
  },
  
  imageRegenerated: (carId: string) => {
    trackEvent('image_regenerated', { car_id: carId });
  },
  
  // Activation events
  paymentMethodAdded: () => {
    trackEvent('payment_method_added');
  },
  
  planSelected: (plan: string) => {
    trackEvent('plan_selected', { plan });
  },
  
  planChanged: (fromPlan: string, toPlan: string, isUpgrade: boolean) => {
    trackEvent('plan_changed', { from_plan: fromPlan, to_plan: toPlan, is_upgrade: isUpgrade });
  },
  
  // Trial events
  trialStarted: (plan: string) => {
    trackEvent('trial_started', { plan });
  },
  
  trialExpired: () => {
    trackEvent('trial_expired');
  },
  
  // Feature usage
  photoUploaded: (carId: string, count: number, isDocumentation: boolean) => {
    trackEvent('photo_uploaded', { car_id: carId, count, is_documentation: isDocumentation });
  },
  
  watermarkApplied: (carId: string, photoCount: number) => {
    trackEvent('watermark_applied', { car_id: carId, photo_count: photoCount });
  },
  
  landingPageShared: (photoCount: number) => {
    trackEvent('landing_page_shared', { photo_count: photoCount });
  },
  
  teamMemberInvited: () => {
    trackEvent('team_member_invited');
  },
  
  // VIP program
  vipApplyClicked: () => {
    trackEvent('vip_apply_clicked');
  },
  
  vipDemoOpened: () => {
    trackEvent('vip_demo_opened');
  },
};
