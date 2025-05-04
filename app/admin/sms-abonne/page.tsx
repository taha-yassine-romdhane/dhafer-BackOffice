'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, Search, Filter, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Subscriber {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  isSubscribed: boolean;
  lastOrderDate: string;
  orderCount: number;
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

  // Mock data for demonstration purposes
  useEffect(() => {
    const mockData: Subscriber[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      username: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phoneNumber: `+216 ${Math.floor(10000000 + Math.random() * 90000000)}`,
      isSubscribed: true, 
      lastOrderDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      orderCount: Math.floor(Math.random() * 10),
    }));

    setSubscribers(mockData);
    setFilteredSubscribers(mockData);
    setLoading(false);
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let filtered = [...subscribers];
    
    // Apply subscription filter
    if (showOnlySubscribed) {
      filtered = filtered.filter(sub => sub.isSubscribed);
    }
    
    // Apply filter option
    if (filterOption === 'active') {
      filtered = filtered.filter(sub => sub.isSubscribed);
    } else if (filterOption === 'inactive') {
      filtered = filtered.filter(sub => !sub.isSubscribed);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        sub => 
          sub.username.toLowerCase().includes(query) || 
          sub.email.toLowerCase().includes(query) ||
          sub.phoneNumber.includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'name') {
        return a.username.localeCompare(b.username);
      } else if (sortOption === 'date') {
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      } else {
        return b.orderCount - a.orderCount;
      }
    });
    
    setFilteredSubscribers(filtered);
  }, [subscribers, searchQuery, showOnlySubscribed, filterOption, sortOption]);

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
      alert('Please enter SMS content');
      return;
    }
    
    if (selectedSubscribers.length === 0) {
      alert('Please select at least one subscriber');
      return;
    }
    
    setSending(true);
    setSmsStatus('idle');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll simulate a successful send
      setSmsStatus('success');
      console.log('SMS would be sent to:', selectedSubscribers);
      console.log('SMS content:', smsContent);
      
      // In a real implementation, you would call your SMS API here
      // const response = await fetch('/api/admin/send-sms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     recipients: selectedSubscribers,
      //     message: smsContent
      //   })
      // });
      
      // Reset form after successful send
      setTimeout(() => {
        setSmsContent('');
        setSelectedSubscribers([]);
        setSelectAll(false);
        setSmsStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsStatus('error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des SMS Abonnés <span className="text-red-500">Sera Fonctionnel Quand le SMS API sera activé</span></h1>
        <p className="mt-2 text-sm text-gray-600">
          Envoyez des SMS à vos clients abonnés pour les informer des promotions et nouveautés
        </p>
      </div>

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
                  <Button variant="outline" size="sm" onClick={() => setFilteredSubscribers(subscribers)}>
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
                      value={filterOption} 
                      onValueChange={(value) => setFilterOption(value as 'all' | 'active' | 'inactive')}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filtrer par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Abonnés</SelectItem>
                        <SelectItem value="inactive">Non abonnés</SelectItem>
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
                        <SelectItem value="date">Date de commande</SelectItem>
                        <SelectItem value="orders">Nb. commandes</SelectItem>
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
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="hidden md:table-cell">Dernière commande</TableHead>
                        <TableHead className="hidden lg:table-cell">Commandes</TableHead>
                        <TableHead>Statut</TableHead>
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
                                aria-label={`Select ${subscriber.username}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{subscriber.username}</TableCell>
                            <TableCell className="hidden md:table-cell">{subscriber.email}</TableCell>
                            <TableCell>{subscriber.phoneNumber}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(subscriber.lastOrderDate)}</TableCell>
                            <TableCell className="hidden lg:table-cell">{subscriber.orderCount}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subscriber.isSubscribed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subscriber.isSubscribed ? 'Abonné' : 'Non abonné'}
                              </span>
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
