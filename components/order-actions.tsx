'use client';

import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import { toast } from 'sonner';
import { Trash2, Edit2, Save, X, Plus, Minus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Size {
  id: number;
  value: string;
}

interface ProductSize {
  sizeId: number;
  size: Size;
}

interface OrderItem {
  id: number;
  quantity: number;
  size?: Size;
  sizeId?: number;
  color?: string;
  productId: number;
  colorVariantId?: number;
  colorVariant?: {
    id: number;
    color: string;
    images: {
      url: string;
      isMain: boolean;
    }[];
  };
  product: {
    id: number;
    name: string;
    price: number;
    description?: string;
    salePrice?: number | null;
    categories?: any[];
    sizes: ProductSize[];
    colorVariants?: {
      id: number;
      color: string;
      images: {
        url: string;
        isMain: boolean;
      }[];
    }[];
  };
}

interface Order {
  id: number;
  customerName: string;
  phoneNumber: string;
  address: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  salePrice?: number | null;
  category: string;
  sizes: string[];
  colorVariants: any[];
}

interface OrderActionsProps {
  orderId: number;
  currentStatus: OrderStatus;
  onOrderUpdated: () => void;
}

export const OrderActions = ({ orderId, currentStatus, onOrderUpdated }: OrderActionsProps) => {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showFullEditModal, setShowFullEditModal] = useState(false);
  const [fullOrder, setFullOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Helper function to determine which value to select in the color dropdown
  const getSelectedColorOption = (item: OrderItem): string => {
    // If we have a valid colorVariantId and it matches a variant, select that variant
    if (item.colorVariantId && item.product?.colorVariants) {
      const matchingVariant = item.product.colorVariants.find((v: any) => v.id === item.colorVariantId);
      if (matchingVariant) {
        return matchingVariant.id.toString();
      }
    }
    
    // If we have a color string that matches a variant color, select that variant
    if (item.color && item.product?.colorVariants) {
      const matchingVariant = item.product.colorVariants.find((v: any) => v.color === item.color);
      if (matchingVariant) {
        return matchingVariant.id.toString();
      }
      
      // If we have a color string but no matching variant, create a custom option
      return `custom:${item.color}`;
    }
    
    // Default to empty selection
    return '';
  };

  // Fetch full order details for edit modal
  const fetchOrderDetails = async () => {
    setLoadingOrder(true);
    try {
      // First fetch the order details
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }
      
      // For each item in the order, fetch the full product details to get all available sizes
      if (data.items && data.items.length > 0) {
        console.log('Fetching product details for order items');
        const updatedItems = await Promise.all(data.items.map(async (item: OrderItem) => {
          try {
            // Fetch the full product details including all available sizes using our new endpoint
            const productResponse = await fetch(`/api/admin/products/${item.productId}`);
            const productData = await productResponse.json();
            
            if (productResponse.ok && productData && productData.success) {
              console.log(`Fetched product ${item.productId}:`, productData.product);
              
              if (productData.product.sizes) {
                console.log(`Product ${item.productId} sizes:`, 
                  productData.product.sizes.map((s: any) => ({
                    sizeId: s.sizeId,
                    value: s.size?.value
                  }))
                );
              }
              
              // Return the item with the full product details
              return {
                ...item,
                product: {
                  ...item.product,
                  sizes: productData.product.sizes || [],
                  colorVariants: productData.product.colorVariants || []
                }
              };
            }
          } catch (err) {
            console.error(`Error fetching product ${item.productId}:`, err);
          }
          // If there was an error, return the original item
          return item;
        }));
        
        // Update the order with the enhanced items
        data.items = updatedItems;
      }
      
      setFullOrder(data);
      setEditedOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Fetch products for edit modal
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      setProducts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle opening edit modal
  const handleOpenEditModal = async () => {
    setShowFullEditModal(true);
    await fetchOrderDetails();
    await fetchProducts();
  };

  // Update customer information
  const updateCustomerInfo = (field: string, value: string) => {
    if (!editedOrder) return;
    // Only allow updating address, not name or phone
    if (field === 'address') {
      setEditedOrder({
        ...editedOrder,
        [field]: value
      });
    }
  };
  
  // Update item information (size, color)
  const updateItemInfo = (itemId: number, field: string, value: string, additionalData?: any) => {
    if (!editedOrder) return;
    
    const updatedItems = editedOrder.items?.map(item => {
      if (item.id === itemId) {
        // Handle special case for color which needs to update both color string and colorVariantId
        if (field === 'color' && additionalData?.colorVariantId) {
          return {
            ...item,
            color: value,
            colorVariantId: additionalData.colorVariantId
          };
        }
        
        // Handle size selection - we need to update both sizeId and size object
        if (field === 'sizeId') {
          const sizeId = value ? parseInt(value) : undefined;
          
          // Find the size object from the product's available sizes
          let sizeObject: Size | undefined = undefined;
          if (sizeId && item.product?.sizes) {
            const matchingSize = item.product.sizes.find(s => s.size?.id === sizeId || s.sizeId === sizeId);
            if (matchingSize && matchingSize.size) {
              sizeObject = matchingSize.size;
            }
          }
          
          console.log(`Updating size for item ${itemId} to sizeId: ${sizeId}, size object:`, sizeObject);
          
          return {
            ...item,
            sizeId: sizeId,
            size: sizeObject
          };
        }
        
        // For other fields, just update the field directly
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    });
    
    setEditedOrder({
      ...editedOrder,
      items: updatedItems
    });
  };

  // Update item quantity
  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (!editedOrder) return;
    
    // Don't allow quantity less than 1
    if (newQuantity < 1) newQuantity = 1;
    
    const updatedItems = editedOrder.items?.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    // Recalculate total amount
    const totalAmount = updatedItems?.reduce(
      (sum, item) => sum + (item.quantity * item.product.price), 0
    );
    
    setEditedOrder({
      ...editedOrder,
      items: updatedItems,
      totalAmount
    });
  };

  // Remove item from order
  const removeItem = (itemId: number) => {
    if (!editedOrder) return;
    
    const updatedItems = editedOrder.items?.filter(item => item.id !== itemId);
    
    // Recalculate total amount
    const totalAmount = updatedItems?.reduce(
      (sum, item) => sum + (item.quantity * item.product.price), 0
    );
    
    setEditedOrder({
      ...editedOrder,
      items: updatedItems,
      totalAmount
    });
  };




  // Save full order changes
  const saveFullOrderChanges = async () => {
    if (!editedOrder) return;
    
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT', // Using PUT for full resource update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Do not send customer name and phone, only address can be changed
          // Keep the original status, don't allow editing it in the modal
          address: editedOrder.address, 
          status: currentStatus, // Use current status, not edited status
          items: editedOrder.items?.map(item => ({
            id: item.id,
            quantity: item.quantity,
            productId: item.productId,
            colorVariantId: item.colorVariantId || null, // Ensure colorVariantId is properly sent
            size: item.size,
            color: item.color
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      toast.success('Commande mise à jour avec succès');
      onOrderUpdated();
      setShowFullEditModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Simple status update
  const handleStatusChange = async () => {
    if (status === currentStatus) return;
    
    setUpdateLoading(true);
    try {
      console.log(`Updating order ${orderId} status to ${status}`);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update order status');
      }
      
      const data = await response.json();
      console.log('Success response:', data);
      
      toast.success(`Status updated to ${status}`);
      onOrderUpdated();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
      // Reset to previous status on error
      setStatus(currentStatus);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    setDeleteLoading(true);
    try {
      console.log(`Deleting order ${orderId}`);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete order');
      }
      
      const data = await response.json();
      console.log('Delete success response:', data);
      
      toast.success('Commande supprimée avec succès');
      onOrderUpdated();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Order deletion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete order');
    } finally {
      setDeleteLoading(false);
    }
  };

  // French translations for order statuses
  const statusTranslations = {
    [OrderStatus.PENDING]: 'En attente',
    [OrderStatus.CONFIRMED]: 'Confirmée',
    [OrderStatus.SHIPPED]: 'Expédiée',
    [OrderStatus.DELIVERED]: 'Livrée',
    [OrderStatus.CANCELLED]: 'Annulée',
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as OrderStatus;
              if (newStatus !== currentStatus) {
                setStatus(newStatus);
                // Immediately save without timeout
                setUpdateLoading(true);
                fetch(`/api/admin/orders/${orderId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status: newStatus }),
                })
                .then(response => response.json())
                .then(data => {
                  if (!data.error) {
                    toast.success('Statut mis à jour');
                    onOrderUpdated();
                  } else {
                    toast.error(data.error || 'Échec de la mise à jour du statut');
                    setStatus(currentStatus); // Revert on error
                  }
                })
                .catch(error => {
                  toast.error(error.message || 'Échec de la mise à jour du statut');
                  setStatus(currentStatus); // Revert on error
                })
                .finally(() => {
                  setUpdateLoading(false);
                });
              }
            }}
            disabled={updateLoading}
            className={`block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs py-1.5 px-2 ${getStatusBadgeClass(status)}`}
          >
            {Object.values(OrderStatus).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusTranslations[statusOption]}
              </option>
            ))}
          </select>
          
          {updateLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        <button
          onClick={handleOpenEditModal}
          className="p-1.5 text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
          title="Modifier la commande complète"
        >
          <Edit2 size={16} />
        </button>
        
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteLoading}
          className="p-1.5 text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
          title="Supprimer la commande"
        >
          {deleteLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>

      {/* Full Order Edit Modal */}
      <Dialog open={showFullEditModal} onOpenChange={setShowFullEditModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la commande #{orderId}</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la commande et des articles
            </DialogDescription>
          </DialogHeader>
          
          {loadingOrder ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : editedOrder ? (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Détails client</TabsTrigger>
                <TabsTrigger value="items">Articles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="status" className="text-right">Status</label>
                    <div className="col-span-3">
                      <div className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusBadgeClass(editedOrder?.status || currentStatus)}`}>
                        {(editedOrder?.status || currentStatus).charAt(0) + (editedOrder?.status || currentStatus).slice(1).toLowerCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        (Utilisez le statut dans la page principale pour le modifier)
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="customerName" className="text-right">Nom du client</label>
                    <input
                      id="customerName"
                      value={editedOrder?.customerName || ''}
                      readOnly
                      className="col-span-3 rounded-md border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="phoneNumber" className="text-right">Téléphone</label>
                    <input
                      id="phoneNumber"
                      value={editedOrder?.phoneNumber || ''}
                      readOnly
                      className="col-span-3 rounded-md border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="address" className="text-right">Adresse</label>
                    <textarea
                      id="address"
                      value={editedOrder?.address || ''}
                      onChange={(e) => updateCustomerInfo('address', e.target.value)}
                      className="col-span-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="items">
                <div className="py-4">
                  <div className="mb-4 font-medium">Total: {editedOrder?.totalAmount.toFixed(2) || '0.00'} TND</div>
                  
                  {editedOrder?.items?.length > 0 ? (
                    <div className="space-y-4">
                      {editedOrder?.items?.map((item) => (
                        <div key={item.id} className="border rounded-md p-3 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
                              <div>
                                <label className="block text-xs mb-1 text-gray-600">Taille:</label>
                                <select 
                                  value={item.sizeId || ''}
                                  onChange={(e) => updateItemInfo(item.id, 'sizeId', e.target.value)}
                                  className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                  <option value="">--</option>
                                  {Array.isArray(item.product?.sizes) ? 
                                    item.product.sizes.map(sizeObj => {
                                      // Log each size object to debug
                                      console.log('Size object:', sizeObj);
                                      return (
                                        <option 
                                          key={sizeObj.sizeId || (sizeObj.size && sizeObj.size.id)} 
                                          value={sizeObj.sizeId || (sizeObj.size && sizeObj.size.id)}
                                        >
                                          {sizeObj.size ? sizeObj.size.value : `Size ID: ${sizeObj.sizeId}`}
                                        </option>
                                      );
                                    })
                                  : <option value="">No sizes available</option>}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs mb-1 text-gray-600">Couleur:</label>
                                <select
                                  value={getSelectedColorOption(item)}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                      // Empty option selected
                                      updateItemInfo(item.id, 'color', '', { colorVariantId: null });
                                    } else if (value.startsWith('custom:')) {
                                      // This is the current custom color text value
                                      // Keep it as is - we're just displaying it in the dropdown
                                    } else {
                                       // Regular color variant selected
                                      const colorVariantId = parseInt(value);
                                      if (!isNaN(colorVariantId) && item.product?.colorVariants) {
                                        const selectedVariant = item.product.colorVariants.find((v: any) => v.id === colorVariantId);
                                        if (selectedVariant) {
                                          updateItemInfo(item.id, 'color', selectedVariant.color, { colorVariantId });
                                        }
                                      }
                                    }
                                  }}
                                  className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                  <option value="">--</option>
                                  {/* Include current color text if it doesn't match any variant */}
                                  {item.color && !item.product.colorVariants?.some(v => v.color === item.color) && (
                                    <option value={`custom:${item.color}`}>{item.color} (actuel)</option>
                                  )}
                                  {item.product.colorVariants?.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                      {variant.color}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="text-sm font-medium mt-1">
                              Prix: {item.product.price.toFixed(2)} TND
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <Minus size={14} />
                            </button>
                            
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            
                            <button 
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <Plus size={14} />
                            </button>
                            
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                              title="Supprimer cet article"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Aucun article dans cette commande
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center text-red-600">
              Impossible de charger les détails de la commande
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFullEditModal(false)}
              disabled={updateLoading}
            >
              Annuler
            </Button>
            <Button
              variant="default"
              onClick={saveFullOrderChanges}
              disabled={updateLoading || !editedOrder}
            >
              {updateLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
