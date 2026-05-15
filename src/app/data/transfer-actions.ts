import { TransferenciaDetalle, TransferGroup } from "../models/transfer.model";

// ================================================================
// ENUM DE ACCIONES
// ================================================================

export enum TransferAction {
  // Tipo A (original)
  MarkAsPickedUp    = 'MarkAsPickedUp',
  MarkAsDelivered   = 'MarkAsDelivered',
  ReturnTransfer    = 'ReturnTransfer',
  ReceiveTransfer   = 'ReceiveTransfer',
  DeleteTransfer    = 'DeleteTransfer',

  // Tipo B (despacho a cliente)
  ConfirmPayment    = 'ConfirmPayment',
  UploadVoucher     = 'UploadVoucher',
  UploadShippingDoc = 'UploadShippingDoc',

  // Grupo (acciones colectivas)
  DispatchGroup     = 'DispatchGroup',   // shiploc: despacha todos los ítems del grupo
  ReceiveGroup      = 'ReceiveGroup',    // recloc: recibe todos los ítems del grupo (ejecuta stock en ERP)
}

// ================================================================
// INTERFACES
// ================================================================

export interface TransferButtonInfo {
  label: string;
  action: TransferAction | null;
  disabled: boolean;
  nextStatus: string | null;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Mensaje explicativo cuando el botón está deshabilitado */
  hint?: string;
}

// ================================================================
// FUNCIÓN INDIVIDUAL — SIN CAMBIOS PARA TRANSFERENCIAS SUELTAS
// Solo agrega el guardia de grupo: si el ítem pertenece a un grupo,
// la única acción permitida en el detalle es MarkAsPickedUp.
// ================================================================

export function getTransferButtonInfo(transfer: TransferenciaDetalle): TransferButtonInfo {

  // ── GUARDIA DE GRUPO ─────────────────────────────────────────
  // Los ítems de grupo solo permiten marcar como Recogido en el
  // detalle individual. El resto de acciones son colectivas y
  // viven en la tarjeta del grupo dentro de la lista.
  if (transfer.transfer_group) {
    if (transfer.tipo === 'ship' && transfer.status === 'Pendiente') {
      return {
        label: '📦 Marcar como Recogido',
        action: TransferAction.MarkAsPickedUp,
        disabled: false,
        nextStatus: 'Recogido',
        variant: 'primary',
      };
    }
    // Cualquier otro estado del ítem de grupo: sin acción en el detalle
    return {
      label: transfer.status === 'Recogido' ? '✅ Recogido' : '⏳ En Proceso',
      action: null,
      disabled: true,
      nextStatus: null,
      variant: 'warning',
      hint: 'Las acciones de este grupo se gestionan desde la lista de transferencias.',
    };
  }
  // ── FIN GUARDIA DE GRUPO ──────────────────────────────────────

  const isTypeB = transfer.is_customer_delivery === 1;

  // ============================================================
  // TIPO B — Despacho a cliente (individual, sin grupo)
  // ============================================================
  if (isTypeB) {
    const userTipo = transfer.tipo;

    // shiploc
    if (userTipo === 'ship') {
      if (transfer.status === 'Pendiente') {
        return {
          label: '📦 Marcar como Recogido',
          action: TransferAction.MarkAsPickedUp,
          disabled: false,
          nextStatus: 'Recogido',
          variant: 'primary',
        };
      }

      if (transfer.status === 'Recogido') {
        const isShipping = transfer.delivery_type !== 'DELIVERY';
        return {
          label: isShipping ? '🚚 Marcar como Enviado al cliente' : '✅ Marcar como Entregado al cliente',
          action: TransferAction.MarkAsDelivered,
          disabled: false,
          nextStatus: isShipping ? 'Enviado al cliente' : 'Entregado al cliente',
          variant: 'success',
        };
      }

      if (transfer.status === 'Entregado al cliente' || transfer.status === 'Enviado al cliente') {
        return {
          label: '✅ Completado',
          action: null,
          disabled: true,
          nextStatus: null,
          variant: 'success',
        };
      }
    }

    // recloc
    if (userTipo === 'rec') {
      if (transfer.status === 'Pendiente') {
        return {
          label: '🗑️ Eliminar Transferencia',
          action: TransferAction.DeleteTransfer,
          disabled: false,
          nextStatus: null,
          variant: 'danger',
        };
      }

      if (transfer.status === 'Entregado al cliente' || transfer.status === 'Enviado al cliente') {
        return {
          label: '📥 Recibir Transferencia',
          action: TransferAction.ReceiveTransfer,
          disabled: false,
          nextStatus: null,
          variant: 'success',
        };
      }
    }

    return {
      label: '⏳ En Proceso',
      action: null,
      disabled: true,
      nextStatus: null,
      variant: 'warning',
    };
  }

  // ============================================================
  // TIPO A — Movimiento interno (original, sin cambios)
  // ============================================================
  if (transfer.tipo === 'ship') {
    switch (transfer.status) {
      case 'Pendiente':
        return { label: '📦 Marcar como Recogido', action: TransferAction.MarkAsPickedUp, disabled: false, nextStatus: 'Recogido', variant: 'primary' };
      case 'Recogido':
        return { label: '✅ Marcar como Entregado', action: TransferAction.MarkAsDelivered, disabled: false, nextStatus: 'Entregado', variant: 'success' };
      case 'Entregado':
        return { label: '↩️ Devolver', action: TransferAction.ReturnTransfer, disabled: false, nextStatus: 'Devuelto', variant: 'warning' };
      case 'Devuelto':
        return { label: '🗑️ Eliminar', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null, variant: 'danger' };
      default:
        return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null, variant: 'primary' };
    }
  }

  if (transfer.tipo === 'rec') {
    switch (transfer.status) {
      case 'Pendiente':
        return { label: '🗑️ Eliminar', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null, variant: 'danger' };
      case 'Recogido':
        return { label: '📥 Recibir Transferencia', action: TransferAction.ReceiveTransfer, disabled: true, nextStatus: 'Entregado', variant: 'primary' };
      case 'Entregado':
        return { label: '📥 Recibir Transferencia', action: TransferAction.ReceiveTransfer, disabled: false, nextStatus: null, variant: 'success' };
      case 'Devuelto':
        return { label: '🗑️ Eliminar', action: TransferAction.DeleteTransfer, disabled: false, nextStatus: null, variant: 'danger' };
      default:
        return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null, variant: 'primary' };
    }
  }

  return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null, variant: 'primary' };
}

// ================================================================
// FUNCIÓN DE GRUPO — Acciones colectivas sobre TransferGroup
// Recibe el grupo completo y el tipo de usuario (ship o rec).
// El estado colectivo se deriva de los ítems, nunca se almacena.
// ================================================================

export function getGroupButtonInfo(
  group: TransferGroup,
  tipo: 'ship' | 'rec'
): TransferButtonInfo {

  const { allPickedUp, pickedUpItems, totalItems, delivery_type } = group;

  // ── shiploc: gestiona el despacho colectivo ──────────────────
  if (tipo === 'ship') {

    // Todos los ítems del grupo han sido despachados
    if (group.items.every(i => i.status === 'Entregado al cliente' || i.status === 'Enviado al cliente')) {
      return {
        label: '✅ Grupo despachado',
        action: null,
        disabled: true,
        nextStatus: null,
        variant: 'success',
      };
    }

    // Picking en progreso: no todos recogidos aún
    if (!allPickedUp) {
      return {
        label: `⏳ Picking en progreso (${pickedUpItems}/${totalItems})`,
        action: null,
        disabled: true,
        nextStatus: null,
        variant: 'warning',
        hint: 'Todos los productos deben estar recogidos para poder despachar.',
      };
    }

    // Todos recogidos: habilitar despacho colectivo
    const isShipping = delivery_type && delivery_type !== 'DELIVERY';
    return {
      label: isShipping ? '🚚 Despachar grupo al cliente' : '✅ Entregar grupo al cliente',
      action: TransferAction.DispatchGroup,
      disabled: false,
      nextStatus: isShipping ? 'Enviado al cliente' : 'Entregado al cliente',
      variant: 'success',
    };
  }

  // ── recloc: gestiona la recepción colectiva ──────────────────
  if (tipo === 'rec') {

    // El grupo ya fue recibido (todos ejecutados en ERP)
    if (group.items.every(i => i.status === 'Entregado al cliente' || i.status === 'Enviado al cliente')) {
      // shiploc despachó pero recloc aún no ejecutó en ERP
      return {
        label: '📥 Recibir grupo',
        action: TransferAction.ReceiveGroup,
        disabled: false,
        nextStatus: null,
        variant: 'success',
      };
    }

    // Picking aún en progreso desde shiploc
    return {
      label: `⏳ Esperando despacho (${pickedUpItems}/${totalItems} recogidos)`,
      action: null,
      disabled: true,
      nextStatus: null,
      variant: 'warning',
      hint: 'El almacén emisor aún no ha despachado todos los productos.',
    };
  }

  return { label: 'Acción no disponible', action: null, disabled: true, nextStatus: null, variant: 'primary' };
}