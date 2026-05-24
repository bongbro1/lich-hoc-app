
import { useCallback } from "react";
import { useLoading } from "../contexts/LoadingContext";

type AsyncFunction<T> = () => Promise<T>;

export function useAsyncAction() {
  const { setLoading } = useLoading();

  const run = useCallback(
    async <T,>(asyncFn: AsyncFunction<T>): Promise<T | null> => {
      try {
        setLoading(true);
        const result = await asyncFn();
        setLoading(false);
        return result;
      } catch (err) {
        setLoading(false);
        console.error("Async action failed:", err);
        return null;
      }
    },
    [setLoading]
  );

  return { run };
}
