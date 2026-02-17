import { TransferenciaDetalle } from '../models/transfer.model';

export enum TransferAction {
  MarkAsPickedUp = 'MarkAsPickedUp',
  MarkAsDelivered = 'MarkAsDelivered',
  ReturnTransfer = 'ReturnTransfer',
  ReceiveTransfer = 'ReceiveTransfer',
  DeleteTransfer = 'DeleteTransfer',
}

export interface TransferButtonInfo {
  label: string;
  action: TransferAction | null;
  disabled: boolean;
  nextStatus: string | null;
}

export function getTransferButtonInfo(transfer: TransferenciaDetalle): TransferButtonInfo {
  if (transfer.tipo === 'ship') {
    switch (transfer.status) {
      case 'Pendiente':
        return { label: 'Marcar como Recogido', action: TransferAction.MarkAsPickedUp, disabled: false, nextStatus: 'Recogido' };
      case 'Recogido':
        return { label: 'Marcar como Entregado', action: TransferAction.MarkAsDelivered, disabled: false, nextStatus: 'Entregado' };
      case 'Entregado':
        return { label: 'Devolver', action: TransferAction.ReturnTransfer, disabled: false, nextStatus: 'Devuelto' };
      case 'Devuelto':
        return { label: 'Eliminar Transferencia', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null };
      default:
        return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null };
    }
  }

  if (transfer.tipo === 'rec') {
    switch (transfer.status) {
      case 'Pendiente':
        return { label: 'Eliminar Transferencia', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null };
      case 'Recogido':
        return { label: 'Recibir Transferencia', action: TransferAction.ReceiveTransfer, disabled: true, nextStatus: 'Entregado' };
      case 'Entregado':
        return { label: 'Recibir Transferencia', action: TransferAction.ReceiveTransfer, disabled: false, nextStatus: null };
      case 'Devuelto':
        return { label: 'Eliminar Transferencia', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null };
      default:
        return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null };
    }
  }

  return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null };
}