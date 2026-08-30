import { createContext, useContext } from 'react';
import { NodeData } from './types';

export const UpdateNodeContext = createContext<(id: string, patch: Partial<NodeData>) => void>(() => {});
export const useUpdateNode = () => useContext(UpdateNodeContext);
