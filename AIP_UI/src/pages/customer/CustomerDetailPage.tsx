import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerWithRelations } from '@/types/customer';
import { BASE_API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { CustomerPageAccessPage } from '@/api/customerPageAccess';
import { customerPageAccessCache } from '@/services/customerPageAccessCache';

export default function CustomerDetailPage() {
  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<{
    isLoading: boolean;
    error: string | null;
    pages: CustomerPageAccessPage[];
  }>({
    isLoading: true,
    error: null,
    pages: []
  });
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!user || !customerId) return;

        const responsePromise = fetch(
          `${BASE_API_URL}/customers/${customerId}?userId=${user.id}`
        );
        const customerNumericId = Number(customerId);
        const pageAccessPromise = Number.isNaN(customerNumericId)
          ? Promise.resolve(null)
          : customerPageAccessCache.get(customerNumericId);

        const [response, pageAccess] = await Promise.all([responsePromise, pageAccessPromise]);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch customer');
        }

        setCustomer(data.data);

        if (pageAccess) {
          const assignedPages = pageAccess.availablePages
            .filter(page => pageAccess.assignedPageIds.includes(page.pageId))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

          setPageState({
            isLoading: false,
            error: null,
            pages: assignedPages
          });
        } else {
          setPageState({
            isLoading: false,
            error: 'Unable to load assigned pages for this customer.',
            pages: []
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setPageState({
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load customer pages',
          pages: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [user, customerId]);

  const handlePageNavigation = (page: CustomerPageAccessPage) => {
    // Navigate to the static customer page routes with customer ID as query parameter
    // This way the customer pages know which customer to display
    const url = `${page.path}?customerId=${customer!.id}`;
    navigate(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          {error || 'Customer not found'}
        </div>
      </div>
    );
  }

  const availablePages = pageState.pages;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/management/customer-reporting')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer Reporting
        </Button>
        
        <div className="mb-4">
          <h1 className="text-3xl font-bold">{customer.companyName}</h1>
          <p className="text-muted-foreground">
            Company Number: {customer.companyNumber}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(customer.customerType) 
            ? customer.customerType 
            : [customer.customerType]
          ).map((type) => (
            <Badge key={type} variant="outline">
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reporting Pages</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any page to access customer-specific reports and data
          </p>
        </CardHeader>
        <CardContent>
          {pageState.isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading assigned pages...</p>
            </div>
          )}

          {!pageState.isLoading && pageState.error && (
            <div className="text-center py-12 text-destructive">
              {pageState.error}
            </div>
          )}

          {!pageState.isLoading && !pageState.error && availablePages.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePages.map(page => (
                <Card 
                  key={page.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePageNavigation(page)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{page.title}</h3>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {page.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {page.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Assigned
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {!pageState.isLoading && !pageState.error && availablePages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pages assigned to this customer</p>
              <p className="text-sm">Contact administrator to configure page assignments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 