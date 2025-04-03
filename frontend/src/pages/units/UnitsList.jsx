// frontend/src/pages/units/UnitsList.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Home, Building, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { getUnits, getProperties, deleteUnit } from '../../lib/api';
import useAuthStore from '../../store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../../components/ui/dialog';

const UnitsList = () => {
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check permissions
  const canManageUnits = ['admin', 'property_manager', 'landlord'].includes(
    user?.role
  );

  // Update the URL handling in UnitsList.jsx
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Extract propertyId from URL if present
        const params = new URLSearchParams(location.search);
        const propertyIdParam = params.get('propertyId');

        if (propertyIdParam) {
          setPropertyFilter(propertyIdParam);
        } else {
          // Set default to 'all' when no property filter is in URL
          setPropertyFilter('all');
        }

        // Set default status filter
        setStatusFilter('all');

        // Fetch properties for the filter dropdown
        const propertiesData = await getProperties();
        setProperties(propertiesData);

        // Fetch units with filters
        const filters = {};
        // Only add property filter if it's not 'all'
        if (propertyIdParam && propertyIdParam !== 'all') {
          filters.propertyId = propertyIdParam;
        }

        const unitsData = await getUnits(filters);
        setUnits(unitsData);
        setFilteredUnits(unitsData);

        // Update page title if property filter is active
        if (propertyIdParam && propertyIdParam !== 'all') {
          const property = propertiesData.find(
            (p) => p.id.toString() === propertyIdParam
          );
          if (property) {
            document.title = `Units - ${property.name} | Angaza Real Estate`;
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  // Filter units when filters change
  useEffect(() => {
    let filtered = [...units];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (unit) =>
          unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (unit.property &&
            unit.property.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by property - only apply if not 'all'
    if (propertyFilter && propertyFilter !== 'all') {
      filtered = filtered.filter(
        (unit) => unit.propertyId.toString() === propertyFilter
      );
    }

    // Filter by status - only apply if not 'all'
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.status === statusFilter);
    }

    setFilteredUnits(filtered);
  }, [searchTerm, propertyFilter, statusFilter, units]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePropertyFilter = (value) => {
    // Convert 'all' to empty string for the filter logic
    const filterValue = value === 'all' ? '' : value;
    setPropertyFilter(filterValue);

    // Update URL with filter
    const params = new URLSearchParams(location.search);
    if (value !== 'all') params.set('propertyId', value);
    else params.delete('propertyId');

    navigate(
      {
        pathname: location.pathname,
        search: params.toString(),
      },
      { replace: true }
    );
  };

  const handleStatusFilter = (value) => {
    // Convert 'all' to empty string for the filter logic
    const filterValue = value === 'all' ? '' : value;
    setStatusFilter(filterValue);
  };
  const confirmDelete = (unit) => {
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!unitToDelete) return;

    try {
      await deleteUnit(unitToDelete.id);
      setUnits(units.filter((unit) => unit.id !== unitToDelete.id));
      setDeleteDialogOpen(false);
      setUnitToDelete(null);
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading units...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Units</h1>
        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8"
            />
          </div>

          <Select value={propertyFilter} onValueChange={handlePropertyFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full md:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          {canManageUnits && propertyFilter && (
            <Button
              onClick={() =>
                navigate(`/units/add?propertyId=${propertyFilter}`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          )}
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div className="text-center py-10">
          <Home className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">No units found</h2>
          <p className="mt-1 text-muted-foreground">
            {searchTerm || propertyFilter || statusFilter
              ? 'Try adjusting your filters'
              : 'Start by adding a new unit to a property'}
          </p>
          {canManageUnits && propertyFilter && (
            <Button
              className="mt-4"
              onClick={() =>
                navigate(`/units/add?propertyId=${propertyFilter}`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <Card
              key={unit.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/units/${unit.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">
                        Unit {unit.unitNumber}
                      </h3>
                      <Badge
                        variant={
                          unit.status === 'vacant'
                            ? 'success'
                            : unit.status === 'occupied'
                            ? 'secondary'
                            : 'warning'
                        }
                      >
                        {unit.status.charAt(0).toUpperCase() +
                          unit.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {canManageUnits && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/units/edit/${unit.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(unit);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="h-4 w-4 mr-2" />
                    <span>
                      {unit.property ? unit.property.name : 'Unknown Property'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="font-medium mr-2">Type:</span>
                    <span>{unit.type}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-medium">
                      KSh {unit.rent.toLocaleString()}
                    </span>
                  </div>
                  {unit.size && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{unit.size} sq. m.</span>
                    </div>
                  )}
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
              Are you sure you want to delete Unit {unitToDelete?.unitNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitsList;
