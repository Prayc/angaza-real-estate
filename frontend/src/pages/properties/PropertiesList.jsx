// frontend/src/pages/properties/PropertiesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { getProperties, deleteProperty } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
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

const PropertiesList = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const canAddProperty = ['admin', 'landlord'].includes(user?.role);
  const canEditProperty = ['admin', 'landlord'].includes(user?.role);

  const fetchProperties = async () => {
    try {
      const data = await getProperties();
      setProperties(data);
      setFilteredProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
    fetchProperties();
  };

  const handleDeleteProperty = async () => {
    if (!deleteId) return;

    try {
      await deleteProperty(deleteId);
      toast.success('Property deleted successfully', { duration: 4000 });
      navigate('/properties');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting property:', error);
      // Check if the error is about active leases
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes('active leases')
      ) {
        toast.error(error.response.data.message, { duration: 4000 });
        navigate('/properties');
        setDeleteDialogOpen(false);
      } else {
        toast.error('Failed to delete property. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Properties</h1>
        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>
          {canAddProperty && (
            <Button onClick={() => navigate('/properties/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-10">
          <Building className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">No properties found</h2>
          <p className="mt-1 text-muted-foreground">
            {searchTerm
              ? 'Try a different search term'
              : 'Start by adding a new property'}
          </p>
          {canAddProperty && (
            <Button
              className="mt-4"
              onClick={() => navigate('/properties/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="relative h-48 cursor-pointer"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                {property.image ? (
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Building className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                {property.featured && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    Featured
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold truncate">
                    {property.name}
                  </h2>
                  {canEditProperty &&
                    (property.landlordId === user.id ||
                      user.role === 'admin') && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/properties/edit/${property.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(property.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                </div>
                <p className="text-muted-foreground text-xs mb-2">
                  {property.address}
                </p>
                <div className="flex justify-between mt-4">
                  <span className="text-sm font-medium">
                    {property.type.charAt(0).toUpperCase() +
                      property.type.slice(1)}
                  </span>
                  <span className="text-sm">
                    {property.availableUnits} / {property.totalUnits} units
                    available
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this property? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteProperty}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertiesList;
