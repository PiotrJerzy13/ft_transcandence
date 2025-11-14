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