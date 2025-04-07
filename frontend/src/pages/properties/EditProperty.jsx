// frontend/src/pages/properties/EditProperty.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { getPropertyById, updateProperty, getLandlords } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const EditProperty = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  const watchType = watch('type');
  const watchFeatured = watch('featured');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        // Fetch property details
        const property = await getPropertyById(Number(id));

        // Fetch landlords if user is admin
        if (isAdmin) {
          try {
            const landlordsList = await getLandlords();
            setLandlords(landlordsList);
          } catch (err) {
            console.error('Failed to fetch landlords:', err);
          }
        }

        // Set form values from fetched property
        reset({
          name: property.name,
          address: property.address,
          type: property.type,
          description: property.description || '',
          totalUnits: property.totalUnits,
          availableUnits: property.availableUnits,
          featured: property.featured,
          landlordId: property.landlordId ? property.landlordId.toString() : '',
        });

        // Set preview image if exists
        if (property.image) {
          setPreviewImage(
            property.image.startsWith('http')
              ? property.image
              : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${
                  property.image
                }`
          );
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property details. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [id, reset, isAdmin]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      const formData = new FormData();
      data["image"] = [imageFile];
      Object.keys(data).forEach((key) => {
        if (key === 'image' && data[key] && data[key].length > 0) {
          formData.append(key, imageFile);
        } else if (key !== 'image') {
          formData.append(key, data[key]);
        }
      });

      await updateProperty(id, formData);
      // navigate(`/properties/${id}`);
    } catch (error) {
      console.error('Error updating property:', error);
      setError(
        error.response?.data?.message ||
          'Failed to update property. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading property data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/properties/${id}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Property
        </Button>
        <h1 className="text-3xl font-bold">Edit Property</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Property Name *
                </label>
                <Input
                  id="name"
                  placeholder="Enter property name"
                  {...register('name', {
                    required: 'Property name is required',
                  })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address *
                </label>
                <Input
                  id="address"
                  placeholder="Enter property address"
                  {...register('address', { required: 'Address is required' })}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-destructive text-sm">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Property Type *
                </label>
                <Select
                  onValueChange={(value) => setValue('type', value)}
                  defaultValue={watchType}
                >
                  <SelectTrigger
                    className={errors.type ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-destructive text-sm">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalUnits" className="text-sm font-medium">
                  Total Units *
                </label>
                <Input
                  id="totalUnits"
                  type="number"
                  min="1"
                  placeholder="Enter total number of units"
                  {...register('totalUnits', {
                    required: 'Total units is required',
                    min: {
                      value: 1,
                      message: 'Total units must be at least 1',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.totalUnits ? 'border-destructive' : ''}
                />
                {errors.totalUnits && (
                  <p className="text-destructive text-sm">
                    {errors.totalUnits.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="availableUnits" className="text-sm font-medium">
                  Available Units *
                </label>
                <Input
                  id="availableUnits"
                  type="number"
                  min="0"
                  placeholder="Enter available units"
                  {...register('availableUnits', {
                    required: 'Available units is required',
                    min: {
                      value: 0,
                      message: 'Available units cannot be negative',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.availableUnits ? 'border-destructive' : ''}
                />
                {errors.availableUnits && (
                  <p className="text-destructive text-sm">
                    {errors.availableUnits.message}
                  </p>
                )}
              </div>

              {/* Landlord Selection - Only visible to admin */}
              {isAdmin && (
                <div className="space-y-2">
                  <label htmlFor="landlordId" className="text-sm font-medium">
                    Assign to Landlord *
                  </label>
                  <Select
                    onValueChange={(value) => setValue('landlordId', value)}
                    defaultValue={watch('landlordId')}
                  >
                    <SelectTrigger
                      className={errors.landlordId ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a landlord" />
                    </SelectTrigger>
                    <SelectContent>
                      {landlords.map((landlord) => (
                        <SelectItem
                          key={landlord.id}
                          value={landlord.id.toString()}
                        >
                          {landlord.name} ({landlord.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.landlordId && (
                    <p className="text-destructive text-sm">
                      {errors.landlordId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Property Image</label>
                <div className="border-2 border-dashed rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Property preview"
                        className="h-40 mx-auto object-cover rounded-md"
                      />
                      <button
                        type="button"
                        className="mt-2 text-sm text-primary hover:underline"
                        onClick={() => {
                          setPreviewImage(null);
                          setValue('image', '');
                        }}
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop an image, or click to browse
                      </p>
                      <Input
                        id="image"
                        type="file"
                        name="image"
                        accept="image/*"
                        {...register('image')}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image').click()}
                      >
                        Browse
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    {...register('featured')}
                    checked={watchFeatured}
                    onCheckedChange={(checked) => setValue('featured', checked)}
                  />
                  <label
                    htmlFor="featured"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Featured Property
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Featured properties are displayed prominently on the homepage
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Enter property description"
                rows={4}
                {...register('description')}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/properties/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProperty;
