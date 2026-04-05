import { LogtoConfig } from '@logto/react';

export const logtoConfig: LogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  resources: [process.env.NEXT_PUBLIC_API_URL!],
  scopes: ['openid', 'profile', 'email'],
};
