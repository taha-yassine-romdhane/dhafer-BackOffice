'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AddSubscriberDialogProps {
  onSuccess: () => void;
}

export function AddSubscriberDialog({ onSuccess }: AddSubscriberDialogProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Le numéro de téléphone est requis');
      return;
    }
    
    // Basic Tunisian phone number validation
    const phoneRegex = /^(\+?216)?[0-9]{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Format de numéro invalide. Utilisez un numéro tunisien à 8 chiffres.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/sms/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          name: name || undefined,
          source: 'manuelle',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Abonné ajouté avec succès');
        setPhoneNumber('');
        setName('');
        setOpen(false);
        onSuccess();
      } else {
        throw new Error(data.error || 'Échec de l\'ajout');
      }
    } catch (error) {
      console.error('Error adding subscriber:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      toast.error('Échec de l\'ajout de l\'abonné');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          <span>Ajouter un abonné</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel abonné</DialogTitle>
          <DialogDescription>
            Ajoutez manuellement un numéro de téléphone à la liste des abonnés SMS.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-right">
                Numéro de téléphone*
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <p className="text-xs text-gray-500">
                Format: numéro tunisien à 8 chiffres, avec ou sans le préfixe +216
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-right">
                Nom (optionnel)
              </Label>
              <Input
                id="name"
                placeholder="Nom de l'abonné"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}