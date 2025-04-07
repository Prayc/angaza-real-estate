// frontend/src/pages/properties/AddProperty.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
import { createProperty, getLandlords } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const AddProperty = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);

  const isAdmin = user?.role === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      type: 'residential',
    },
  });

  const watchType = watch('type');

  const fileInputRef = useRef(null);

  // Fetch landlords list if user is admin
  useEffect(() => {
    if (isAdmin) {
      const fetchLandlords = async () => {
        try {
          const landlordsList = await getLandlords();
          setLandlords(landlordsList);
        } catch (err) {
          console.error('Failed to fetch landlords:', err);
          setError('Failed to load landlords list. Please refresh the page.');
        }
      };

      fetchLandlords();
    }
  }, [isAdmin]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
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

      console.log('DATA', data);

      // Get the file from the ref
      // const imageFile = fileInputRef.current?.files[0];
      // console.log('Image file from ref:', imageFile);

      const formData = new FormData();

      // Add all text fields
      formData.append('name', data.name);
      formData.append('address', data.address);
      formData.append('type', data.type);
      formData.append('totalUnits', data.totalUnits);
      if (data.description) {
        formData.append('description', data.description);
      }

      if (isAdmin && data.landlordId) {
        formData.append('landlordId', data.landlordId);
      }

      // Add the image file if it exists
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await createProperty(formData);
      navigate(`/properties/${response.property.id}`);
    } catch (error) {
      console.error('Error creating property:', error);
      setError(
        error.response?.data?.message ||
          'Failed to create property. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/properties')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>
        <h1 className="text-3xl font-bold">Add New Property</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              {/* Landlord Selection - Only visible to admin */}
              {isAdmin && (
                <div className="space-y-2">
                  <label htmlFor="landlordId" className="text-sm font-medium">
                    Assign to Landlord *
                  </label>
                  <Select
                    onValueChange={(value) => setValue('landlordId', value)}
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
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
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
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {/* <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        {...register('image')}
                        onChange={handleImageChange}
                        className="hidden"
                      /> */}
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
                onClick={() => navigate('/properties')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProperty;
