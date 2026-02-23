// store/positioning-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PositioningState {
  positioning: any | null;
  isPositioned: boolean;
  setPositioning: (positioning: any) => void;
  clearPositioning: () => void;
}

export const usePositioningStore = create<PositioningState>()(
  persist(
    immer((set) => ({
      positioning: null,
      isPositioned: false,
      
      setPositioning: (positioning) => {
        set((state) => {
          state.positioning = positioning;
          state.isPositioned = true;
        });
      },
      
      clearPositioning: () => {
        set((state) => {
          state.positioning = null;
          state.isPositioned = false;
        });
      },
    })),
    {
      name: 'positioning-store',
    }
  )
);