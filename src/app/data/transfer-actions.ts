import { TransferenciaDetalle } from "../models/transfer.model";

export enum TransferAction {
  // Tipo A (original)
  MarkAsPickedUp = 'MarkAsPickedUp',
  MarkAsDelivered = 'MarkAsDelivered',
  ReturnTransfer = 'ReturnTransfer',
  ReceiveTransfer = 'ReceiveTransfer',
  DeleteTransfer = 'DeleteTransfer',
  
  // Tipo B (despacho a cliente)
  ConfirmPayment = 'ConfirmPayment',
  UploadVoucher = 'UploadVoucher',
  UploadShippingDoc = 'UploadShippingDoc',
}

export interface TransferButtonInfo {
  label: string;
  action: TransferAction | null;
  disabled: boolean;
  nextStatus: string | null;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function getTransferButtonInfo(transfer: TransferenciaDetalle): TransferButtonInfo {
  const isTypeB = transfer.is_customer_delivery === 1;
  
  // ============ TIPO B (Despacho a cliente) ============
  if (isTypeB) {
    const userTipo = transfer.tipo; // 'ship' o 'rec'
    
    // ============================================
    // VISTA DE shiploc (almacén que envía)
    // ============================================
    if (userTipo === 'ship') {
      // Pendiente -> puede marcar como Recogido
      if (transfer.status === 'Pendiente') {
        return {
          label: '📦 Marcar como Recogido',
          action: TransferAction.MarkAsPickedUp,
          disabled: false,
          nextStatus: 'Recogido',
          variant: 'primary'
        };
      }
      
      // Recogido -> puede marcar como Entregado/Enviado
      if (transfer.status === 'Recogido') {
        const label = transfer.delivery_type === 'shipping' 
          ? '🚚 Marcar como Enviado al cliente' 
          : '✅ Marcar como Entregado al cliente';
        
        return {
          label: label,
          action: TransferAction.MarkAsDelivered,
          disabled: false,
          nextStatus: transfer.delivery_type === 'shipping' ? 'Enviado al cliente' : 'Entregado al cliente',
          variant: 'success'
        };
      }
      
      // Estados finales
      if (transfer.status === 'Entregado al cliente' || transfer.status === 'Enviado al cliente') {
        return {
          label: '✅ Completado',
          action: null,
          disabled: true,
          nextStatus: null,
          variant: 'success'
        };
      }
    }
    
    // ============================================
    // VISTA DE recloc (almacén que recibe)
    // ============================================
    if (userTipo === 'rec') {
      // Pendiente -> puede eliminar
      if (transfer.status === 'Pendiente') {
        return {
          label: '🗑️ Eliminar Transferencia',
          action: TransferAction.DeleteTransfer,
          disabled: false,
          nextStatus: null,
          variant: 'danger'
        };
      }
      
      // Cuando shiploc marca como Entregado/Enviado -> recloc puede recibir
      if (transfer.status === 'Entregado al cliente' || transfer.status === 'Enviado al cliente') {
        return {
          label: '📥 Recibir Transferencia',
          action: TransferAction.ReceiveTransfer,
          disabled: false,
          nextStatus: null,
          variant: 'success'
        };
      }
    }
    
    return {
      label: '⏳ En Proceso',
      action: null,
      disabled: true,
      nextStatus: null,
      variant: 'warning'
    };
  }
  
  // ============ TIPO A (Movimiento interno - original) ============
  if (transfer.tipo === 'ship') {
    switch (transfer.status) {
      case 'Pendiente':
        return { 
          label: '📦 Marcar como Recogido', 
          action: TransferAction.MarkAsPickedUp, 
          disabled: false, 
          nextStatus: 'Recogido', 
          variant: 'primary' 
        };
      case 'Recogido':
        return { 
          label: '✅ Marcar como Entregado', 
          action: TransferAction.MarkAsDelivered, 
          disabled: false, 
          nextStatus: 'Entregado', 
          variant: 'success' 
        };
      case 'Entregado':
        return { 
          label: '↩️ Devolver', 
          action: TransferAction.ReturnTransfer, 
          disabled: false, 
          nextStatus: 'Devuelto', 
          variant: 'warning' 
        };
      case 'Devuelto':
        return { 
          label: '🗑️ Eliminar', 
          action: TransferAction.DeleteTransfer, 
          disabled: false, 
          nextStatus: null, 
          variant: 'danger' 
        };
      default:
        return { 
          label: 'Acción no disponible', 
          action: null, 
          disabled: true, 
          nextStatus: null, 
          variant: 'primary' 
        };
    }
  }

  if (transfer.tipo === 'rec') {
    switch (transfer.status) {
      case 'Pendiente':
        return { 
          label: '🗑️ Eliminar', 
          action: TransferAction.DeleteTransfer, 
          disabled: false, 
          nextStatus: null, 
          variant: 'danger' 
        };
      case 'Recogido':
        return { 
          label: '📥 Recibir Transferencia', 
          action: TransferAction.ReceiveTransfer, 
          disabled: true, 
          nextStatus: 'Entregado', 
          variant: 'primary' 
        };
      case 'Entregado':
        return { 
          label: '📥 Recibir Transferencia', 
          action: TransferAction.ReceiveTransfer, 
          disabled: false, 
          nextStatus: null, 
          variant: 'success' 
        };
      case 'Devuelto':
        return { 
          label: '🗑️ Eliminar', 
          action: TransferAction.DeleteTransfer, 
          disabled: false, 
          nextStatus: null, 
          variant: 'danger' 
        };
      default:
        return { 
          label: 'Acción no disponible', 
          action: null, 
          disabled: true, 
          nextStatus: null, 
          variant: 'primary' 
        };
    }
  }

  return { 
    label: 'Acción no disponible', 
    action: null, 
    disabled: true, 
    nextStatus: null, 
    variant: 'primary' 
  };
}