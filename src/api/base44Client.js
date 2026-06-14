// Base44 SDK disabled - migrated to Supabase
// This file kept for backwards compatibility with
// any remaining imports
export const base44 = {
  auth: {
    me: async () => null,
    isAuthenticated: async () => false,
  },
  entities: new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => async () => [],
    })
  }),
  functions: {
    invoke: async () => ({ data: null }),
  },
  connectors: {
    connectAppUser: async () => '#',
    disconnectAppUser: async () => {},
  },
  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: '' }),
    }
  },
}
