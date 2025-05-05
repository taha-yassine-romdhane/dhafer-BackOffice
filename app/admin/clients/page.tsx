'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Trash2,
  FileDown,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Client {
  id: number
  username: string
  email: string
  createdAt: string
  isSubscribed: boolean
  fidelityPoints: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  // Apply filters and search
  useEffect(() => {
    let result = [...clients]
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(client => 
        client.username.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term)
      )
    }
    
    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      const isSubscribed = subscriptionFilter === 'subscribed'
      result = result.filter(client => client.isSubscribed === isSubscribed)
    }
    
    setFilteredClients(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [clients, searchTerm, subscriptionFilter])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
      setFilteredClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (id: number) => {
    setClientToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      const response = await fetch(`/api/admin/clients/${clientToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete client')
      
      setClients(clients.filter(client => client.id !== clientToDelete))
      toast.success('Client supprimé avec succès')
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Échec de la suppression du client')
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const headers = ['Username', 'Email', 'Date d\'inscription', 'Points de fidélité']
      
      // Format client data
      const data = clients.map(client => {
        // Format date as DD/MM/YYYY
        const date = new Date(client.createdAt)
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
        
        return [
          client.username,
          client.email,
          formattedDate,
          client.fidelityPoints
        ]
      })
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      
      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Clients')
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `clients_${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast.success('Export Excel réussi!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Erreur lors de l\'export Excel')
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSubscriptionFilter('all')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Button onClick={exportToExcel} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90">
            <FileDown className="h-4 w-4" />
            Exporter Excel
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center">
                <Filter className="mr-2 h-5 w-5 text-gray-500" />
                Filtres
              </h2>
              {(searchTerm || subscriptionFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Réinitialiser
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
                </div>
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-6 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-[#D4AF37] shadow-sm"
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-[#D4AF37]" />
                  </button>
                )}
              </div>
              
              {/* Subscription Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut d'abonnement</label>
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] py-2 pl-3 pr-10 text-base"
                >
                  <option value="all">Tous les clients</option>
                  <option value="subscribed">Abonnés</option>
                  <option value="not-subscribed">Non abonnés</option>
                </select>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-4 text-sm text-gray-500">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} trouvé{filteredClients.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date D&apos;inscription</TableHead>
                <TableHead>Points de fidelité</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    Aucun client trouvé
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.username}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{client.fidelityPoints}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(client.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredClients.length)} sur {filteredClients.length} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => paginate(pageNum)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-[#D4AF37] hover:bg-[#D4AF37]/90' : ''}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="h-8 rounded-md border border-gray-300 text-sm"
                >
                  {[5, 10, 25, 50].map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">par page</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action ne peut pas être annulée.
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
  )
}
