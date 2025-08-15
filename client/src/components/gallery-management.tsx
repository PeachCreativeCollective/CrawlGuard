import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Edit, Eye, EyeOff } from "lucide-react";
import { ObjectUploader } from "./ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GalleryImage, InsertGalleryImage, UpdateGalleryImage } from "@shared/schema";
import type { UploadResult } from '@uppy/core';

export function GalleryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedImageInfo, setUploadedImageInfo] = useState<{
    fileName: string;
    fileSize: string;
    mimeType: string;
  } | null>(null);

  // Form state for new image
  const [newImageForm, setNewImageForm] = useState({
    title: "",
    description: "",
    altText: "",
    category: "general",
    isPublished: false,
    displayOrder: "0",
    seoKeywords: "",
  });

  // Form state for editing image
  const [editImageForm, setEditImageForm] = useState({
    title: "",
    description: "",
    altText: "",
    category: "general",
    isPublished: false,
    displayOrder: "0",
    seoKeywords: "",
  });

  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/admin/gallery"],
  });

  const createImageMutation = useMutation({
    mutationFn: async (imageData: InsertGalleryImage) => {
      const response = await apiRequest("POST", "/api/admin/gallery", imageData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({
        title: "Success",
        description: "Image added to gallery successfully",
      });
      setIsAddImageOpen(false);
      resetNewImageForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add image",
        variant: "destructive",
      });
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateGalleryImage }) => {
      const response = await apiRequest("PATCH", `/api/admin/gallery/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({
        title: "Success",
        description: "Image updated successfully",
      });
      setIsEditImageOpen(false);
      setEditingImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update image",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/gallery/${imageId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/admin/gallery/upload");
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      setUploadedImageUrl(file.uploadURL as string);
      setUploadedImageInfo({
        fileName: file.name || "unknown",
        fileSize: file.size?.toString() || "0",
        mimeType: file.type || "image/jpeg",
      });
      setNewImageForm(prev => ({
        ...prev,
        altText: prev.altText || (file.name || "image").replace(/\.[^/.]+$/, ""), // Use filename without extension as default alt text
      }));
    }
  };

  const resetNewImageForm = () => {
    setNewImageForm({
      title: "",
      description: "",
      altText: "",
      category: "general",
      isPublished: false,
      displayOrder: "0",
      seoKeywords: "",
    });
    setUploadedImageUrl("");
    setUploadedImageInfo(null);
  };

  const handleAddImage = () => {
    if (!uploadedImageUrl || !uploadedImageInfo) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!newImageForm.title.trim() || !newImageForm.altText.trim()) {
      toast({
        title: "Error",
        description: "Title and alt text are required",
        variant: "destructive",
      });
      return;
    }

    createImageMutation.mutate({
      ...newImageForm,
      imageUrl: uploadedImageUrl,
      fileName: uploadedImageInfo.fileName,
      fileSize: uploadedImageInfo.fileSize,
      mimeType: uploadedImageInfo.mimeType,
    });
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image);
    setEditImageForm({
      title: image.title,
      description: image.description || "",
      altText: image.altText,
      category: image.category || "general",
      isPublished: image.isPublished || false,
      displayOrder: image.displayOrder || "0",
      seoKeywords: image.seoKeywords || "",
    });
    setIsEditImageOpen(true);
  };

  const handleUpdateImage = () => {
    if (!editingImage) return;

    if (!editImageForm.title.trim() || !editImageForm.altText.trim()) {
      toast({
        title: "Error",
        description: "Title and alt text are required",
        variant: "destructive",
      });
      return;
    }

    updateImageMutation.mutate({
      id: editingImage.id,
      updates: editImageForm,
    });
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const togglePublishStatus = (image: GalleryImage) => {
    updateImageMutation.mutate({
      id: image.id,
      updates: { isPublished: !image.isPublished },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading gallery images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
          <p className="text-gray-600">Manage your project photos with SEO optimization</p>
        </div>
        <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-image">
              <Upload className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Gallery Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Upload Image</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full mt-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Image to Upload
                </ObjectUploader>
                {uploadedImageUrl && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">✓ Image uploaded successfully</p>
                    <p className="text-sm text-green-600">{uploadedImageInfo?.fileName}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newImageForm.title}
                    onChange={(e) => setNewImageForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Crawl Space Encapsulation Project"
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newImageForm.category}
                    onValueChange={(value) => setNewImageForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="crawl-space">Crawl Space</SelectItem>
                      <SelectItem value="waterproofing">Waterproofing</SelectItem>
                      <SelectItem value="encapsulation">Encapsulation</SelectItem>
                      <SelectItem value="basement">Basement</SelectItem>
                      <SelectItem value="before-after">Before & After</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="alt-text">Alt Text *</Label>
                <Input
                  id="alt-text"
                  value={newImageForm.altText}
                  onChange={(e) => setNewImageForm(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Describe the image for accessibility and SEO"
                  data-testid="input-alt-text"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newImageForm.description}
                  onChange={(e) => setNewImageForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the project..."
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label htmlFor="seo-keywords">SEO Keywords</Label>
                <Input
                  id="seo-keywords"
                  value={newImageForm.seoKeywords}
                  onChange={(e) => setNewImageForm(prev => ({ ...prev, seoKeywords: e.target.value }))}
                  placeholder="waterproofing, crawl space, encapsulation, Asheville"
                  data-testid="input-seo-keywords"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display-order">Display Order</Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={newImageForm.displayOrder}
                    onChange={(e) => setNewImageForm(prev => ({ ...prev, displayOrder: e.target.value }))}
                    data-testid="input-display-order"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is-published"
                    checked={newImageForm.isPublished}
                    onCheckedChange={(checked) => setNewImageForm(prev => ({ ...prev, isPublished: checked }))}
                    data-testid="switch-published"
                  />
                  <Label htmlFor="is-published">Published</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddImage}
                  disabled={createImageMutation.isPending}
                  data-testid="button-save-image"
                >
                  {createImageMutation.isPending ? "Adding..." : "Add Image"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddImageOpen(false)}
                  data-testid="button-cancel-add"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative">
              <img
                src={image.imageUrl}
                alt={image.altText}
                className="w-full h-48 object-cover"
                data-testid={`img-gallery-${image.id}`}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant={image.isPublished ? "default" : "secondary"}
                  onClick={() => togglePublishStatus(image)}
                  data-testid={`button-toggle-publish-${image.id}`}
                >
                  {image.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{image.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditImage(image)}
                    data-testid={`button-edit-${image.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteImage(image.id)}
                    data-testid={`button-delete-${image.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={image.isPublished ? "default" : "secondary"}>
                  {image.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline">{image.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{image.description}</p>
              <p className="text-xs text-gray-500">Alt: {image.altText}</p>
              {image.seoKeywords && (
                <p className="text-xs text-gray-500 mt-1">Keywords: {image.seoKeywords}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Image Modal */}
      <Dialog open={isEditImageOpen} onOpenChange={setIsEditImageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editImageForm.title}
                    onChange={(e) => setEditImageForm(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-edit-title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editImageForm.category}
                    onValueChange={(value) => setEditImageForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="crawl-space">Crawl Space</SelectItem>
                      <SelectItem value="waterproofing">Waterproofing</SelectItem>
                      <SelectItem value="encapsulation">Encapsulation</SelectItem>
                      <SelectItem value="basement">Basement</SelectItem>
                      <SelectItem value="before-after">Before & After</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-alt-text">Alt Text *</Label>
                <Input
                  id="edit-alt-text"
                  value={editImageForm.altText}
                  onChange={(e) => setEditImageForm(prev => ({ ...prev, altText: e.target.value }))}
                  data-testid="input-edit-alt-text"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editImageForm.description}
                  onChange={(e) => setEditImageForm(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div>
                <Label htmlFor="edit-seo-keywords">SEO Keywords</Label>
                <Input
                  id="edit-seo-keywords"
                  value={editImageForm.seoKeywords}
                  onChange={(e) => setEditImageForm(prev => ({ ...prev, seoKeywords: e.target.value }))}
                  data-testid="input-edit-seo-keywords"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-display-order">Display Order</Label>
                  <Input
                    id="edit-display-order"
                    type="number"
                    value={editImageForm.displayOrder}
                    onChange={(e) => setEditImageForm(prev => ({ ...prev, displayOrder: e.target.value }))}
                    data-testid="input-edit-display-order"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="edit-is-published"
                    checked={editImageForm.isPublished}
                    onCheckedChange={(checked) => setEditImageForm(prev => ({ ...prev, isPublished: checked }))}
                    data-testid="switch-edit-published"
                  />
                  <Label htmlFor="edit-is-published">Published</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdateImage}
                  disabled={updateImageMutation.isPending}
                  data-testid="button-update-image"
                >
                  {updateImageMutation.isPending ? "Updating..." : "Update Image"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditImageOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}