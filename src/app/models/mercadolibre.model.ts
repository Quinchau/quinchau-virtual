export type MLDireccion = 'matcheo' | 'lectura' | 'escritura';

export interface MLAttribute {
  campo: string;
  label: string;
  direccion: MLDireccion;
  obligatorio: boolean;
}

export interface ColumnMapping {
  columna: string;
  campo: string;
}

/** Fila de trabajo interna del componente: una por columna detectada en el Excel */
export interface ColumnMappingRow {
  columna: string;
  /** '' significa "no mapear esta columna" */
  campo: string;
}