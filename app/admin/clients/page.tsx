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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/admin/clients/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete client')
      
      setClients(clients.filter(client => client.id !== id))
      toast.success('Client deleted successfully')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  const exportToCSV = () => {
    // Prepare CSV data
    const csvData = clients.map(client => ({
      Username: client.username,
      Email: client.email,
      'Date d\'inscription': new Date(client.createdAt).toLocaleDateString(),
      'Souscrit': client.isSubscribed ? 'Oui' : 'Non',
      'Points de fidélité': client.fidelityPoints.toString()
    }))

    // Create CSV content
    const headers = ['Username', 'Email', 'Date d\'inscription', 'Souscrit', 'Points de fidélité']
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
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
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
          <CardTitle>Clients</CardTitle>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exporter CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date D&apos;inscription</TableHead>
                <TableHead>Souscrit</TableHead>
                <TableHead>Points de fidelité</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.username}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{formatDate(client.createdAt)}</TableCell>
                  <TableCell>{client.isSubscribed ? 'Oui' : 'Non'}</TableCell>
                  <TableCell>{client.fidelityPoints}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(client.id)}
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
