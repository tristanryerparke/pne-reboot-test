import { Button } from "@/components/ui/button";
import { LoaderIcon } from "lucide-react";
import useStore from '../store';
import { useState, useCallback } from 'react';

export default function ExecuteMenu() {
  const [loading, setLoading] = useState(false);
  const nodes = useStore(state => state.nodes);
  const edges = useStore(state => state.edges);
  

  const execute = useCallback(() => {
    setLoading(true);
    const executeMessage = {
      nodes: nodes,
      edges: edges,
    }

    fetch('http://localhost:8000/graph_execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(executeMessage),
    });
    setLoading(false);
  }, [nodes, edges]);

  return <div className='w-full'>
    <Button
      className='w-full'
      onClick={execute}
      disabled={loading}
    >
      {loading ? (
        <LoaderIcon className="animate-spin" />
      ) : (
        "Execute"
      )}
    </Button>
  </div>
}