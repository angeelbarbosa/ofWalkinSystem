import { ConvexReactClient } from 'convex/react';

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'https://graceful-dachshund-276.convex.cloud';

export const convexClient = new ConvexReactClient(CONVEX_URL);
