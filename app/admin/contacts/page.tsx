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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete contact')
      
      setContacts(contacts.filter(contact => contact.id !== id))
      toast.success('Message deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete message')
    }
  }

  const exportToCSV = () => {
    // Prepare CSV data
    const csvData = contacts.map(contact => ({
      Date: new Date(contact.createdAt).toLocaleDateString(),
      Name: contact.user ? contact.user.username : contact.name || 'Non spécifié',
      Email: contact.user ? contact.user.email : contact.email || 'Non spécifié',
      Phone: contact.phone || 'Non spécifié',
      Message: contact.message.replace(/"/g, '""') // Escape quotes for CSV
    }))

    // Create CSV content
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Message']
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Messages des Clients</CardTitle>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exporter CSV
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
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(contact.id)}
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
    </div>
  )
}
