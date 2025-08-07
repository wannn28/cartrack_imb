export const DebugLog = (message: string, data?: any) => {
    if (import.meta.env.VITE_DEBUG_VIEW === 'true') {
      console.log(message, data ?? '');
    }
  };
  