'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, Search, RefreshCw, CheckCircle, AlertCircle, Bell, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface StockNotification {
  id: number;
  phoneNumber: string;
  productId: number;
  productName: string;
  size: string;
  color: string;
  isNotified: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

export default function StockNotificationsPage() {
  const [notifications, setNotifications] = useState<StockNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<StockNotification | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sending, setSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);
  const [filterOption, setFilterOption] = useState<'all' | 'pending' | 'sent'>('all');
  const [sortOption, setSortOption] = useState<'date' | 'product'>('date');
  const [smsCharCount, setSmsCharCount] = useState(0);
  const [smsSegments, setSmsSegments] = useState(1);

  // Function to fetch notifications that can be called after adding or deleting
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stock-notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setFilteredNotifications(data.notifications);
      } else {
        console.error('Unexpected API response format:', data);
        setNotifications([]);
        setFilteredNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Call fetchNotifications on initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let filtered = [...notifications];
    
    // Apply filter option
    if (filterOption === 'pending') {
      filtered = filtered.filter(notif => !notif.isNotified);
    } else if (filterOption === 'sent') {
      filtered = filtered.filter(notif => notif.isNotified);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        notif => 
          notif.phoneNumber.includes(query) ||
          notif.productName.toLowerCase().includes(query) ||
          notif.size.toLowerCase().includes(query) ||
          notif.color.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.productName.localeCompare(b.productName);
      }
    });
    
    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, filterOption, sortOption]);
  
  // Calculate SMS character count and segments
  useEffect(() => {
    const count = smsContent.length;
    setSmsCharCount(count);
    
    // SMS segments calculation
    if (count <= 160) {
      setSmsSegments(1);
    } else {
      setSmsSegments(Math.ceil(count / 153));
    }
  }, [smsContent]);

  // Auto-generate message when a notification is selected
  useEffect(() => {
    if (selectedNotification) {
      const template = `Bonjour,

Bonne nouvelle! Le produit "${selectedNotification.productName}" en taille ${selectedNotification.size} et en couleur ${selectedNotification.color} que vous attendiez est maintenant disponible.

Visitez notre site pour passer votre commande.

Cordialement,
Dar Koftan`;
      
      setSmsContent(template);
    } else {
      setSmsContent('');
    }
  }, [selectedNotification]);

  const selectNotification = (notification: StockNotification) => {
    setSelectedNotification(notification);
  };

  const handleSendNotifications = async () => {
    if (!selectedNotification) {
      toast.error('Veuillez sélectionner une notification');
      return;
    }
    
    if (!smsContent.trim()) {
      toast.error('Veuillez entrer un message SMS');
      return;
    }
    
    // Only send notifications that haven't been sent yet
    if (selectedNotification.isNotified) {
      toast.error('Cette notification a déjà été envoyée');
      return;
    }
    
    setSending(true);
    setNotificationStatus('idle');
    
    try {
      // First, mark the notification as sent
      const markResponse = await fetch('/api/admin/stock-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [selectedNotification.id]
        })
      });
      
      if (!markResponse.ok) throw new Error('Failed to mark notifications as sent');
      
      const markData = await markResponse.json();
      
      if (!markData.success) throw new Error(markData.error || 'Failed to update notification status');
      
      // Then, send SMS notification to the customer
      // Ensure phone number is properly formatted
      let phone = selectedNotification.phoneNumber.replace(/\D/g, '');
      // Remove Tunisia country code if present (we'll let the API add it back consistently)
      if (phone.startsWith('216') && phone.length > 8) {
        phone = phone.substring(3);
      }
      
      const selectedPhones = [phone];
      
      const smsResponse = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones: selectedPhones,
          message: smsContent
        })
      });
      
      const smsData = await smsResponse.json();
      
      if (smsData.success) {
        setNotificationStatus('success');
        toast.success(`Notification envoyée avec succès au client`);
        
        // Refresh the list of notifications
        fetchNotifications();
      } else {
        throw new Error(smsData.error || 'Failed to send SMS notifications');
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setNotificationStatus('error');
      toast.error(`Échec de l'envoi des notifications: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSending(false);
      // Reset selection
      setSelectedNotification(null);
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/stock-notifications?id=${notificationToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete notification');
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Notification supprimée avec succès');
        // Refresh the notifications list
        fetchNotifications();
      } else {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Format as dd/mm/yyyy
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="ml-2">Chargement...</p>
    </div>
  }

  return (
    <div className=" mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications de Stock</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les notifications aux clients pour les produits en rupture de stock
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette notification ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotification}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* SMS Composer */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Composer un SMS</CardTitle>
              <CardDescription>
                Envoyez des SMS aux clients en attente de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sms-content">Message SMS</Label>
                  <Textarea
                    id="sms-content"
                    placeholder="Saisissez votre message..."
                    value={smsContent}
                    onChange={(e) => setSmsContent(e.target.value)}
                    className="h-40 mt-1 resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      Caractères: {smsCharCount}/160
                    </span>
                    <span>
                      {smsSegments > 1 ? `${smsSegments} segments` : '1 segment'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={handleSendNotifications}
                      disabled={sending || !selectedNotification || !smsContent.trim()}
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
                          {selectedNotification ? `Envoyer à ${selectedNotification.phoneNumber}` : 'Sélectionnez une notification'}
                        </>
                      )}
                    </Button>
                  </div>
                  {notificationStatus === 'success' && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      SMS envoyés avec succès
                    </div>
                  )}
                  {notificationStatus === 'error' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 flex items-center text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Échec de l'envoi. Veuillez réessayer.
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Conseils pour les SMS:</h3>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                    <li>Gardez vos messages courts et clairs</li>
                    <li>Incluez un appel à l'action</li>
                    <li>Évitez les caractères spéciaux</li>
                    <li>Un SMS standard contient jusqu'à 160 caractères</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Notifications Table */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Liste des Notifications</CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification(s) trouvée(s)
                </CardDescription>
              </div>
              
              <Button 
                onClick={() => fetchNotifications()}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Rechercher des notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-6 border-gray-300 focus:border-primary focus:ring-primary shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        <X className="h-5 w-5 text-gray-400 hover:text-primary" />
                      </button>
                    )}
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <Select
                      value={filterOption}
                      onValueChange={(value) => setFilterOption(value as 'all' | 'pending' | 'sent')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="sent">Notifié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort Option */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trier par</label>
                    <Select
                      value={sortOption}
                      onValueChange={(value) => setSortOption(value as 'date' | 'product')}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="product">Nom du produit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Notifications Table */}
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Action</TableHead>
                        <TableHead className="whitespace-nowrap">Produit</TableHead>
                        <TableHead className="w-[80px] text-center">Taille</TableHead>
                        <TableHead className="w-[100px] text-center">Couleur</TableHead>
                        <TableHead className="w-[130px]">Téléphone</TableHead>
                        <TableHead className="w-[140px] text-center">Date de demande</TableHead>
                        <TableHead className="w-[120px] text-center">Statut</TableHead>
                        <TableHead className="w-[80px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <LoadingSpinner />
                            <p className="mt-2 text-sm text-gray-500">Chargement des notifications...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredNotifications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-sm text-gray-500">Aucune notification trouvée</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredNotifications.map((notification) => (
                          <TableRow key={notification.id} className={notification.isNotified ? 'bg-gray-50' : ''}>
                            <TableCell>
                              <Button 
                                size="sm"
                                variant={selectedNotification?.id === notification.id ? "default" : "outline"}
                                onClick={() => selectNotification(notification)}
                                disabled={notification.isNotified}
                                className={notification.isNotified ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                {selectedNotification?.id === notification.id ? "Sélectionné" : "Sélectionner"}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{notification.productName}</TableCell>
                            <TableCell className="text-center">{notification.size}</TableCell>
                            <TableCell className="text-center">{notification.color}</TableCell>
                            <TableCell>{notification.phoneNumber}</TableCell>
                            <TableCell className="text-center whitespace-nowrap">{formatDate(notification.createdAt)}</TableCell>
                            <TableCell className="text-center">
                              {notification.isNotified ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Notifié
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(notification.notifiedAt)}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  En attente
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setNotificationToDelete(notification.id);
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
