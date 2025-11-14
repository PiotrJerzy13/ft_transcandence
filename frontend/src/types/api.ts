export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
  }
  
  export interface PaginationParams {
    page: number;
    limit: number;
    sort?: string;
  }
  