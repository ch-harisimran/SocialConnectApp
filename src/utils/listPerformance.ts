import { FlatListProps } from 'react-native';

export const FLAT_LIST_PERF_PROPS = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 6,
  initialNumToRender: 8,
  windowSize: 7,
  updateCellsBatchingPeriod: 50,
} satisfies Partial<FlatListProps<unknown>>;
