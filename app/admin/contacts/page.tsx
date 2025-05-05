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
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Contact {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string
  createdAt: string
  user?: {
    username: string
    email: string
  } | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts')
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteDialog = (id: string) => {
    setContactToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!contactToDelete) return

    try {
      const response = await fetch(`/api/admin/contacts/${contactToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete contact')
      
      setContacts(contacts.filter(contact => contact.id !== contactToDelete))
      toast.success('Message supprimé avec succès')
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Échec de la suppression du message')
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare Excel data
      const excelData = contacts.map(contact => ({
        Date: new Date(contact.createdAt).toLocaleDateString(),
        Nom: contact.user ? contact.user.username : contact.name || 'Non spécifié',
        Email: contact.user ? contact.user.email : contact.email || 'Non spécifié',
        Téléphone: contact.phone || 'Non spécifié',
        Message: contact.message
      }))

      // Create a workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
      
      // Generate Excel file and trigger download
      const fileName = `contacts_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      toast.success('Export Excel réussi')
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      toast.error('Erreur lors de l\'export Excel')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Messages des Clients</CardTitle>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exporter Excel
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{formatDate(contact.createdAt)}</TableCell>
                  <TableCell>
                    {contact.user ? contact.user.username : contact.name || 'Non spécifié'}
                  </TableCell>
                  <TableCell>
                    {contact.user ? contact.user.email : contact.email || 'Non spécifié'}
                  </TableCell>
                  <TableCell>{contact.phone || 'Non spécifié'}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {contact.message}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(contact.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action ne peut pas être annulée.
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
