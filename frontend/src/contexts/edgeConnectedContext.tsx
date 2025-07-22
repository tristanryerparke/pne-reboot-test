import { createContext, useContext, ReactNode } from 'react';

interface EdgeConnectedContextType {
  isConnected: boolean;
}

const EdgeConnectedContext = createContext<EdgeConnectedContextType>({ isConnected: false });

export function EdgeConnectedProvider({ 
  children, 
  isConnected 
}: { 
  children: ReactNode; 
  isConnected: boolean 
}) {
  return (
    <EdgeConnectedContext.Provider value={{ isConnected }}>
      {children}
    </EdgeConnectedContext.Provider>
  );
}

export function useEdgeConnected() {
  return useContext(EdgeConnectedContext);
} 