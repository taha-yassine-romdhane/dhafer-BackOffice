'use client';

import { useState, useEffect } from 'react';
import { Size } from '@/lib/types';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function SizePage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    value: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/admin/sizes');
      if (!response.ok) throw new Error('Failed to fetch sizes');
      const data = await response.json();
      setSizes(data.sizes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value) {
      setError('Size value is required');
      return;
    }

    try {
      const url = '/api/admin/sizes';
      const method = editingId ? 'PUT' : 'POST';
      const requestBody = editingId 
        ? { ...formData, id: editingId }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(editingId ? 'Failed to update size' : 'Failed to create size');

      fetchSizes();
      setFormData({ value: '', description: '' });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (size: Size) => {
    setFormData({
      value: size.value,
      description: size.description || ''
    });
    setEditingId(size.id);
  };

  const openDeleteDialog = (id: number) => {
    setSizeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!sizeToDelete) return;

    try {
      // Fix: Send the ID in the request body as expected by the API
      const response = await fetch(`/api/admin/sizes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: sizeToDelete }),
      });

      if (!response.ok) throw new Error('Failed to delete size');
      
      fetchSizes();
      toast.success('Taille supprimée avec succès');
      setDeleteDialogOpen(false);
      setSizeToDelete(null);
    } catch (err) {
      console.error('Error deleting size:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete size');
      toast.error('Échec de la suppression de la taille');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Gestion des tailles</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Size Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Modifier une taille' : 'Ajouter une taille'}
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valeur
            </label>
            <Input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ value: '', description: '' });
                  setEditingId(null);
                }}
                className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingId ? 'Modifier la taille' : 'Ajouter une taille'}
            </button>
          </div>
        </div>
      </form>

      {/* Sizes List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tailles</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sizes.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              Aucune taille trouvée
            </div>
          ) : (
            sizes.map((size) => (
              <div key={size.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{size.value}</h3>
                  {size.description && (
                    <p className="text-sm text-gray-500">{size.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(size)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(size.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>


    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette taille ? Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}