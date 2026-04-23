import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTodos(data ?? []);
    setLoading(false);
  }, []);

  const add = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from('todos')
      .insert({ text: trimmed, done: false })
      .select()
      .single();
    if (!error && data) setTodos(prev => [data, ...prev]);
  }, []);

  const toggle = useCallback(async (id, done) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    const { error } = await supabase.from('todos').update({ done }).eq('id', id);
    if (error) setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  }, []);

  const updateText = useCallback(async (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return remove(id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: trimmed } : t));
    await supabase.from('todos').update({ text: trimmed }).eq('id', id);
  }, []);

  const remove = useCallback(async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  }, []);

  const clearCompleted = useCallback(async () => {
    setTodos(prev => prev.filter(t => !t.done));
    await supabase.from('todos').delete().eq('done', true);
  }, []);

  return { todos, loading, load, add, toggle, updateText, remove, clearCompleted };
}
