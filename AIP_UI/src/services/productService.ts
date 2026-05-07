import { api, ApiResponse } from "@/config/api"

export interface Product {
  productId: number
  ean: string
  productName: string
  category?: string
  description?: string
  price?: number
  brand?: string
  manufacturer?: string
  section?: string
  isActive: boolean
}

export interface ProductLookupResponse {
  productId: number
  ean: string
  productName: string
  category?: string
  description?: string
  price?: number
}

export const productService = {
  // Get product by EAN/barcode
  getProductByEAN: async (ean: string): Promise<ProductLookupResponse | null> => {
    try {
      console.log('🔄 [ProductService] Fetching product by EAN:', ean)
      
      const response = await api.get<ApiResponse<ProductLookupResponse>>(`/product/ean/${encodeURIComponent(ean)}`)
      
      if (response.data.success && response.data.data) {
        console.log('✅ [ProductService] Successfully fetched product:', response.data.data.productName)
        return response.data.data
      } else {
        console.error('❌ [ProductService] Failed to fetch product:', response.data.message)
        return null
      }
    } catch (error: any) {
      console.error('❌ [ProductService] Error fetching product:', error)
      // If 404, product not found (normal case)
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Get all products
  getProducts: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    category?: string
  }): Promise<Product[]> => {
    try {
      console.log('🔄 [ProductService] Fetching products')
      
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.category) queryParams.append('category', params.category)
      
      const response = await api.get<ApiResponse<Product[]>>(`/product?${queryParams}`)
      
      if (response.data.success && response.data.data) {
        console.log('✅ [ProductService] Successfully fetched products:', response.data.data.length)
        return response.data.data
      } else {
        console.error('❌ [ProductService] Failed to fetch products:', response.data.message)
        return []
      }
    } catch (error) {
      console.error('❌ [ProductService] Error fetching products:', error)
      return []
    }
  },

  // Get product by ID
  getProductById: async (id: number): Promise<Product | null> => {
    try {
      console.log('🔄 [ProductService] Fetching product by ID:', id)
      
      const response = await api.get<ApiResponse<Product>>(`/product/${id}`)
      
      if (response.data.success && response.data.data) {
        console.log('✅ [ProductService] Successfully fetched product:', response.data.data.productName)
        return response.data.data
      } else {
        console.error('❌ [ProductService] Failed to fetch product:', response.data.message)
        return null
      }
    } catch (error: any) {
      console.error('❌ [ProductService] Error fetching product:', error)
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  }
}

