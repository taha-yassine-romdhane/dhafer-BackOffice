import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, delete all related orders for this client
    await prisma.order.deleteMany({
      where: {
        userId: parseInt(params.id)
      }
    })

    // Then delete the client
    const deletedClient = await prisma.user.delete({
      where: {
        id: parseInt(params.id)
      }
    })

    return NextResponse.json(deletedClient)
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
