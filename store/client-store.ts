// store/client-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Client {
  id: string;
  name: string;
  company?: string;
  role?: string;
  industry?: string;
  baseline_lsi?: number;
  target_lsi?: number;
}

interface ClientState {
  currentClient: Client | null;
  clients: Client[];
  setCurrentClient: (client: Client | null) => void;
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    immer((set) => ({
      currentClient: null,
      clients: [],
      
      setCurrentClient: (client) => {
        set((state) => {
          state.currentClient = client;
        });
      },
      
      setClients: (clients) => {
        set((state) => {
          state.clients = clients;
        });
      },
      
      addClient: (client) => {
        set((state) => {
          state.clients.push(client);
        });
      },
      
      updateClient: (id, updates) => {
        set((state) => {
          const index = state.clients.findIndex(c => c.id === id);
          if (index !== -1) {
            state.clients[index] = { ...state.clients[index], ...updates };
          }
          if (state.currentClient?.id === id) {
            state.currentClient = { ...state.currentClient, ...updates };
          }
        });
      },
    })),
    {
      name: 'client-store',
      partialize: (state) => ({ 
        currentClient: state.currentClient,
        clients: state.clients 
      }),
    }
  )
);