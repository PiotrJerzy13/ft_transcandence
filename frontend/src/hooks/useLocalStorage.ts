export function useLocalStorage<T>(key: string, initialValue: T) {
    const [stored, setStored] = React.useState<T>(() => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    });
  
    const setValue = (value: T) => {
      setStored(value);
      localStorage.setItem(key, JSON.stringify(value));
    };
  
    return [stored, setValue] as const;
  }

  export async function timingMiddleware(request: any, reply: any) {
    const start = Date.now();
    
    reply.addHook('onSend', async () => {
      const duration = Date.now() - start;
      reply.header('X-Response-Time', `${duration}ms`);
    });
  }