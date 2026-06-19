import { defineMiddleware } from 'astro/middleware';
import { getSessionUserId, getUserById, SESSION_COOKIE } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const token = context.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      const userId = await getSessionUserId(token);
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          context.locals.currentUser = {
            id: user.id,
            email: user.email,
            username: user.username,
          };
        }
      }
    }
  } catch {
    // Headers unavailable during prerendering
  }

  const response = await next();
  return response;
});
