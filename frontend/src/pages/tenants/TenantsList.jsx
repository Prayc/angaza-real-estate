// frontend/src/pages/tenants/TenantsList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, User, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { getTenants, deleteTenant } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';

const TenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Check if user has permission to add/edit tenants
  const canManageTenants = ['admin', 'landlord'].includes(user?.role);

  // Check if user can delete tenants
  const canDeleteTenants = ['admin', 'landlord'].includes(user?.role);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await getTenants();
        setTenants(data);
        setFilteredTenants(data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTenants(tenants);
    } else {
      const filtered = tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tenant.phone && tenant.phone.includes(searchTerm))
      );
      setFilteredTenants(filtered);
    }
  }, [searchTerm, tenants]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (e, tenant) => {
    e.stopPropagation();
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteTenant(tenantToDelete.id);

      // Remove the deleted tenant from state
      setTenants((prevTenants) =>
        prevTenants.filter((tenant) => tenant.id !== tenantToDelete.id)
      );

      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      // You could add error notification here
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading tenants...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Tenants</h1>
        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          {/* {canManageTenants && (
            <Button onClick={() => navigate('/tenants/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          )} */}
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <div className="text-center py-10">
          <User className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">No tenants found</h2>
          <p className="mt-1 text-muted-foreground">
            {searchTerm
              ? 'Try a different search term'
              : 'Start by adding a new tenant'}
          </p>
          {canManageTenants && (
            <Button className="mt-4" onClick={() => navigate('/tenants/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/tenants/${tenant.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">{tenant.name}</h3>
                      <Badge
                        variant={tenant.isActive ? 'success' : 'secondary'}
                      >
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {/* Edit button */}
                    {canManageTenants && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tenants/edit/${tenant.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete button - only for admin */}
                    {canDeleteTenants && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(e, tenant)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{tenant.email}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lease Status:</span>
                    <span className="font-medium">
                      {tenant.leases && tenant.leases.length > 0
                        ? `${
                            tenant.leases.filter(
                              (lease) => lease.status === 'active'
                            ).length
                          } Active Lease(s)`
                        : 'No Active Leases'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tenant "{tenantToDelete?.name}
              "? This action cannot be undone.
              {tenantToDelete?.leases?.some(
                (lease) => lease.status === 'active'
              ) && (
                <div className="mt-2 text-destructive font-medium">
                  Warning: This tenant has active leases. Deleting them will
                  affect those lease agreements.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantsList;
