'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AddSubscriberDialog } from './add-subscriber-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Subscriber {
  id: number;
  phoneNumber: string;
  name?: string;
  isActive: boolean;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SMSAbonnePage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [smsCharCount, setSmsCharCount] = useState(0);
  const [smsSegments, setSmsSegments] = useState(1);
  const [filterOption, setFilterOption] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOption, setSortOption] = useState<'name' | 'date' | 'orders'>('name');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<number | null>(null);

  // Function to fetch subscribers that can be called after adding a new one
  const fetchSubscribers = async () => {

      try {
        setLoading(true);
        const response = await fetch('/api/admin/sms/subscribers');
        if (!response.ok) throw new Error('Failed to fetch subscribers');
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers);
          setFilteredSubscribers(data.subscribers);
        } else {
          console.error('Unexpected API response format:', data);
          setSubscribers([]);
          setFilteredSubscribers([]);
        }
      } catch (error) {
        console.error('Error fetching subscribers:', error);
        setSubscribers([]);
        setFilteredSubscribers([]);
      } finally {
        setLoading(false);
      }
    };
    
  // Call fetchSubscribers on initial load
  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let filtered = [...subscribers];
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        sub => 
          (sub.name?.toLowerCase().includes(query) || false) || 
          sub.phoneNumber.includes(query) ||
          (sub.source?.toLowerCase().includes(query) || false)
      );
    }
    
    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(sub => sub.source === sourceFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'name') {
        // Sort by name if available, otherwise by ID
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortOption === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // For 'orders' we don't have real data, so just sort by date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    setFilteredSubscribers(filtered);
  }, [subscribers, searchQuery, showOnlySubscribed, filterOption, sortOption, sourceFilter]);

  // Handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedSubscribers(filteredSubscribers.map(sub => sub.id));
    } else {
      setSelectedSubscribers([]);
    }
  }, [selectAll, filteredSubscribers]);

  // Calculate SMS character count and segments
  useEffect(() => {
    const count = smsContent.length;
    setSmsCharCount(count);
    
    // SMS segments calculation (160 chars for single segment, 153 for multi-segment)
    if (count <= 160) {
      setSmsSegments(1);
    } else {
      setSmsSegments(Math.ceil(count / 153));
    }
  }, [smsContent]);

  const toggleSubscriberSelection = (id: number) => {
    if (selectedSubscribers.includes(id)) {
      setSelectedSubscribers(selectedSubscribers.filter(subId => subId !== id));
    } else {
      setSelectedSubscribers([...selectedSubscribers, id]);
    }
  };

  const handleSendSMS = async () => {
    if (smsContent.trim() === '') {
      alert('Veuillez saisir le contenu du SMS');
      return;
    }
    
    if (selectedSubscribers.length === 0) {
      alert('Veuillez sélectionner au moins un abonné');
      return;
    }
    
    setSending(true);
    setSmsStatus('idle');
    
    try {
      // Get selected subscriber phone numbers
      const selectedPhones = filteredSubscribers
        .filter(sub => selectedSubscribers.includes(sub.id))
        .map(sub => sub.phoneNumber);
      
      if (selectedPhones.length === 0) {
        throw new Error('No valid phone numbers found');
      }
      
      // Call the SMS API
      const response = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones: selectedPhones,
          message: smsContent
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSmsStatus('success');
        toast.success(`SMS envoyé avec succès à ${selectedPhones.length} abonnés`);
        
        // Reset form after successful send
        setTimeout(() => {
          setSmsContent('');
          setSelectedSubscribers([]);
          setSelectAll(false);
          setSmsStatus('idle');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsStatus('error');
      toast.error(`Échec de l'envoi du SMS: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!subscriberToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/sms/subscribers?id=${subscriberToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete subscriber');
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Abonné supprimé avec succès');
        // Refresh the subscribers list
        fetchSubscribers();
      } else {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeleteDialogOpen(false);
      setSubscriberToDelete(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des SMS Abonnés</h1>
        <p className="mt-2 text-sm text-gray-600">
          Envoyez des SMS à vos clients abonnés pour les informer des promotions et nouveautés
        </p>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet abonné ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubscriber}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SMS Composer Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Composer un SMS</CardTitle>
              <CardDescription>
                Créez votre message et sélectionnez les destinataires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sms-content">Message</Label>
                  <Textarea
                    id="sms-content"
                    placeholder="Exemple Promotion de 20% sur les commandes du mois de Ramadan avec Dar Koftan al assil..."
                    value={smsContent}
                    onChange={(e) => setSmsContent(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>Caractères: {smsCharCount}/160</span>
                    <span>Segments: {smsSegments}</span>
                  </div>
                </div>
                
                <div>
                  <Label>Destinataires sélectionnés</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">
                      {selectedSubscribers.length} abonnés sélectionnés
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <Button 
                onClick={handleSendSMS} 
                disabled={sending || smsContent.trim() === '' || selectedSubscribers.length === 0}
                className="w-full"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer le SMS
                  </>
                )}
              </Button>
              
              {smsStatus === 'success' && (
                <div className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-md">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>SMS envoyé avec succès!</span>
                </div>
              )}
              
              {smsStatus === 'error' && (
                <div className="flex items-center justify-center p-2 bg-red-50 text-red-700 rounded-md">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>Erreur lors de l'envoi du SMS</span>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Subscribers Table Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Liste des Abonnés</CardTitle>
                  <CardDescription>
                    {filteredSubscribers.length} abonnés trouvés
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <AddSubscriberDialog onSuccess={fetchSubscribers} />
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('');
                    setSortOption('name');
                    setFilteredSubscribers(subscribers);
                  }}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Rechercher par nom, email ou téléphone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select 
                      value={sourceFilter}
                      onValueChange={(value) => setSourceFilter(value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les sources</SelectItem>
                        {Array.from(new Set(subscribers.map(s => s.source).filter(Boolean)))
                          .map(source => (
                            <SelectItem key={source} value={source || ''}>
                              {source}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={sortOption} 
                      onValueChange={(value) => setSortOption(value as 'name' | 'date' | 'orders')}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="date">Date d'inscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subscribers Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectAll} 
                            onCheckedChange={() => setSelectAll(!selectAll)}
                            aria-label="Select all subscribers"
                          />
                        </TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden md:table-cell">Source</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="hidden md:table-cell">Date d'inscription</TableHead>
              
                        <TableHead className="w-10">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Chargement des abonnés...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredSubscribers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-sm text-gray-500">Aucun abonné trouvé</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscribers.map((subscriber) => (
                          <TableRow key={subscriber.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedSubscribers.includes(subscriber.id)}
                                onCheckedChange={() => toggleSubscriberSelection(subscriber.id)}
                                aria-label={`Select ${subscriber.name || subscriber.phoneNumber}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{subscriber.name || 'Non spécifié'}</TableCell>
                            <TableCell className="hidden md:table-cell">{subscriber.source || 'Site web'}</TableCell>
                            <TableCell>{subscriber.phoneNumber}</TableCell>
                            <TableCell className="hidden md:table-cell">{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(subscriber.createdAt))}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSubscriberToDelete(subscriber.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
