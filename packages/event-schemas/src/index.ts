// User Events
export interface UserRegisteredEvent {
  type: 'user.registered';
  payload: {
    userId: string;
    email: string;
    name: string;
    surname: string;
    registeredAt: string;
  };
}

export interface UserDeletedEvent {
  type: 'user.deleted';
  payload: {
    userId: string;
    deletedAt: string;
  };
}

// Chef Profile Events
export interface ChefProfileCreatedEvent {
  type: 'chef_profile.created';
  payload: {
    profileId: string;
    userId: string;
    slug: string;
    createdAt: string;
  };
}

export interface ChefProfileUpdatedEvent {
  type: 'chef_profile.updated';
  payload: {
    profileId: string;
    changedFields: string[];
    updatedAt: string;
  };
}

export interface ChefProfileVerifiedEvent {
  type: 'chef_profile.verified';
  payload: {
    profileId: string;
    badgeType: 'verified' | 'michelin' | 'recommended' | 'privateChef';
    verifiedAt: string;
  };
}

// Dish Events
export interface DishCreatedEvent {
  type: 'dish.created';
  payload: {
    dishId: string;
    chefProfileId: string;
    name: string;
    mediaIds: string[];
    createdAt: string;
  };
}

export interface DishDeletedEvent {
  type: 'dish.deleted';
  payload: {
    dishId: string;
    chefProfileId: string;
    mediaIds: string[];
    deletedAt: string;
  };
}

// Review Events
export interface ReviewSubmittedEvent {
  type: 'review.submitted';
  payload: {
    reviewId: string;
    chefProfileId: string;
    userId: string;
    rating: number;
    submittedAt: string;
  };
}

// Media Events
export interface MediaUploadedEvent {
  type: 'media.uploaded';
  payload: {
    mediaId: string;
    url: string;
    type: 'image' | 'video' | 'document';
    width?: number;
    height?: number;
    uploadedAt: string;
  };
}

export interface MediaProcessingCompleteEvent {
  type: 'media.processing_complete';
  payload: {
    mediaId: string;
    variants: Array<{
      size: string;
      url: string;
    }>;
    processedAt: string;
  };
}

// Badge Events
export interface BadgeRequestSubmittedEvent {
  type: 'badge.request_submitted';
  payload: {
    requestId: string;
    chefProfileId: string;
    badgeType: string;
    submittedAt: string;
  };
}

export interface BadgeRequestReviewedEvent {
  type: 'badge.request_reviewed';
  payload: {
    requestId: string;
    chefProfileId: string;
    badgeType: string;
    status: 'APPROVED' | 'REJECTED';
    reviewedAt: string;
  };
}

// Analytics Events
export interface ProfileViewedEvent {
  type: 'profile.viewed';
  payload: {
    profileId: string;
    viewerUserId?: string;
    isChefViewer: boolean;
    viewedAt: string;
  };
}

// Union type of all events
export type ChefHubEvent =
  | UserRegisteredEvent
  | UserDeletedEvent
  | ChefProfileCreatedEvent
  | ChefProfileUpdatedEvent
  | ChefProfileVerifiedEvent
  | DishCreatedEvent
  | DishDeletedEvent
  | ReviewSubmittedEvent
  | MediaUploadedEvent
  | MediaProcessingCompleteEvent
  | BadgeRequestSubmittedEvent
  | BadgeRequestReviewedEvent
  | ProfileViewedEvent;

// Event type constants
export const EventTypes = {
  USER_REGISTERED: 'user.registered',
  USER_DELETED: 'user.deleted',
  CHEF_PROFILE_CREATED: 'chef_profile.created',
  CHEF_PROFILE_UPDATED: 'chef_profile.updated',
  CHEF_PROFILE_VERIFIED: 'chef_profile.verified',
  DISH_CREATED: 'dish.created',
  DISH_DELETED: 'dish.deleted',
  REVIEW_SUBMITTED: 'review.submitted',
  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_PROCESSING_COMPLETE: 'media.processing_complete',
  BADGE_REQUEST_SUBMITTED: 'badge.request_submitted',
  BADGE_REQUEST_REVIEWED: 'badge.request_reviewed',
  PROFILE_VIEWED: 'profile.viewed',
} as const;

// Exchange name
export const EXCHANGE_NAME = 'chefhub.events';
