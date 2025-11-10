import { useState, useEffect } from "react";
import { User, Mail, Camera, Save } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId } from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProfileProps {
  accessToken: string;
  user: any;
  onUpdate: () => void;
}

export function Profile({ accessToken, user, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
  });
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.profilePhoto || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(photoFile);
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/profile/photo`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: photoFile.name,
            }),
          }
        );

        if (response.ok) {
          toast.success("Profile photo updated!");
          onUpdate();
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to upload photo");
        }
      };
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload photo if changed
      if (photoFile) {
        await uploadPhoto();
      }

      // Update profile data
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7ef5248e/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success("Profile updated successfully!");
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl mb-8 text-gray-900">My Profile</h1>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  {photoPreview ? (
                    <ImageWithFallback
                      src={photoPreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl border-4 border-blue-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-4">Click camera icon to change photo</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed capitalize"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Role cannot be changed</p>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-gray-700 mb-2">User ID</label>
                <input
                  type="text"
                  value={user?.id || ""}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
                  disabled
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
