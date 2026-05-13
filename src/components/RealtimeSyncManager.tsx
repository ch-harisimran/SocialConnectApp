import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch } from '../store/hooks';
import { refreshPosts } from '../store/slices/postsSlice';

const POLL_INTERVAL_MS = 15_000;

const RealtimeSyncManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(refreshPosts());
    }, POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        dispatch(refreshPosts());
      }
      appState.current = nextState;
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [dispatch]);

  return null;
};

export default RealtimeSyncManager;
