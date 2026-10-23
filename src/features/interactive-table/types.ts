export interface TableConfig {
  rows: number;
  cols: number;
  hasHeader: boolean;
  bordered: boolean;
  striped: boolean;
}

export interface TableCell {
  row: number;
  col: number;
  value: string;
}
