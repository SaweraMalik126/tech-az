import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface SocialLink {
  id?: number;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'github';
  url: string;
  is_public: boolean;
}

interface FormData {
  full_name: string;
  bio: string;
  phone_number: string;
  language_preference: string;
  timezone: string;
  gender: string;
  dob: string;
}

export function useUserProfile() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    bio: '',
    phone_number: '',
    language_preference: 'en',
    timezone: 'UTC',
    gender: 'other',
    dob: ''
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    push: true,
    sms: false
  });
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      loadProfileData();
      // Always refresh profile from DB to ensure latest profile_picture_url after session/login changes
      (async () => {
        try {
          const { data: fresh, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', profile.id)
            .single();
          if (!error && fresh) {
            setFormData((prev) => ({
              ...prev,
              full_name: fresh.full_name || '',
              bio: fresh.bio || '',
              phone_number: fresh.phone_number || '',
              language_preference: fresh.language_preference || 'en',
              timezone: fresh.timezone || 'UTC',
              gender: fresh.gender || 'other',
              dob: fresh.dob || ''
            }));
          }
        } catch (e) {
          // ignore
        }
      })();
      loadSocialLinks();
    }
  }, [profile]);

  // Real-time subscription for social links changes
  useEffect(() => {
    if (!profile?.id) return;

    const socialLinksSubscription = supabase
      .channel('social-links-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_social_links',
          filter: `user_id=eq.${profile.id}`
        },
        async (payload) => {
          console.log('Social links real-time update:', payload);
          // Reload social links when they change
          await loadSocialLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(socialLinksSubscription);
    };
  }, [profile?.id]);

  const loadProfileData = () => {
    if (!profile) return;
    
    setFormData({
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      phone_number: profile.phone_number || '',
      language_preference: profile.language_preference || 'en',
      timezone: profile.timezone || 'UTC',
      gender: profile.gender || 'other',
      dob: profile.dob || ''
    });
    
    if (profile.notification_preferences) {
      setNotificationPreferences(profile.notification_preferences);
    }
  };

  const loadSocialLinks = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_social_links')
        .select('*')
        .eq('user_id', profile.id)
        .order('platform');
      
      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    if (!profile?.id) return null;

    // Basic validation to avoid long waits on invalid files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WEBP image.',
        variant: 'destructive',
      });
      return null;
    }
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return null;
    }

    setUploadingPicture(true);
    try {
      // Check for a real Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = Boolean(sessionData?.session?.access_token);

      if (!hasSession) {
        // Testing fallback: upload via backend admin endpoint using userId
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const resp = await fetch('http://localhost:3001/api/testing/upload-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id, fileBase64: dataUrl, filename: file.name })
        });
        const json = await resp.json();
        if (!json.success) {
          toast({ title: 'Upload failed', description: json.message || 'Backend upload failed.', variant: 'destructive' });
          return null;
        }
        return json.publicUrl as string;
      }

      // Authenticated path: direct upload to Supabase Storage
      const preflight = await supabase.storage
        .from('avatars')
        .list(profile.id, { limit: 1 });
      if (preflight.error) {
        const msg = preflight.error.message || '';
        let description = msg;
        if (/bucket|not\s*found/i.test(msg)) {
          description = "Bucket 'avatars' not found. Create it in Supabase Storage.";
        } else if (/permission|access\s*denied|not\s*authorized/i.test(msg)) {
          description = "Permission denied. Update Storage policies to allow authenticated users to list/upload to 'avatars'.";
        }
        toast({ title: 'Storage not accessible', description, variant: 'destructive' });
        return null;
      }

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const uploadPromise = supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 15000)
      );

      try {
        // @ts-expect-error Promise race types
        await Promise.race([uploadPromise, timeoutPromise]);
      } catch (e: any) {
        console.error('Upload error:', e);
        let description = e?.message || 'Failed to upload profile picture.';
        if (e?.message === 'UPLOAD_TIMEOUT') {
          description = "Upload timed out. Check your network and ensure the 'avatars' bucket exists with proper policies.";
        } else if (e?.statusCode === '404' || /Not\s*Found|bucket/i.test(description)) {
          description = "Bucket 'avatars' not found. Create a Storage bucket named exactly 'avatars' in Supabase.";
        } else if (e?.statusCode === '403' || /Access\s*Denied|permission/i.test(description)) {
          description = "Permission denied. Update Storage policies to allow authenticated users to upload to 'avatars'.";
        }
        toast({ title: 'Upload failed', description, variant: 'destructive' });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        toast({
          title: 'URL not generated',
          description: 'Image uploaded but no public URL was returned. Ensure the bucket is public or use signed URLs.',
          variant: 'destructive',
        });
        return null;
      }
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Upload error',
        description: error?.message || 'An error occurred while uploading your profile picture.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingPicture(false);
    }
  };

  const saveSocialLinks = async () => {
    if (!profile?.id) return;
    
    try {
      // Delete existing social links
      await supabase
        .from('user_social_links')
        .delete()
        .eq('user_id', profile.id);

      // Insert new social links
      if (socialLinks.length > 0) {
        const { error } = await supabase
          .from('user_social_links')
          .insert(
            socialLinks.map(link => ({
              user_id: profile.id,
              platform: link.platform,
              url: link.url,
              is_public: link.is_public
            }))
          );

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save social links. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteProfilePicture = async () => {
    if (!profile?.id) return false;
    const currentUrl = profile.profile_picture_url || '';
    if (!currentUrl || !currentUrl.includes('/storage/v1/object/')) return false;

    try {
      // Derive path relative to bucket from public URL
      // Example: https://<proj>.supabase.co/storage/v1/object/public/avatars/<user_id>/<file>
      const marker = '/public/avatars/';
      const idx = currentUrl.indexOf(marker);
      if (idx === -1) return false;
      const filePath = currentUrl.substring(idx + marker.length);

      // Remove from storage
      const { error: removeError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
      if (removeError) {
        toast({ title: 'Delete failed', description: removeError.message, variant: 'destructive' });
        return false;
      }

      // Null out the URL in DB
      await updateProfile({ profile_picture_url: null });

      toast({ title: 'Profile picture removed', description: 'Your profile picture was deleted.' });
      return true;
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      toast({ title: 'Delete error', description: error?.message || 'Could not delete picture.', variant: 'destructive' });
      return false;
    }
  };

  const updateUserProfile = async (profilePicture?: File) => {
    if (!profile?.id) return;
    
    setIsLoadingProfile(true);
    try {
      let profilePictureUrl = null;
      
      if (profilePicture) {
        profilePictureUrl = await uploadProfilePicture(profilePicture);
      }

      const updateData: any = {
        full_name: formData.full_name,
        bio: formData.bio,
        phone_number: formData.phone_number,
        language_preference: formData.language_preference,
        timezone: formData.timezone,
        gender: formData.gender,
        notification_preferences: notificationPreferences
      };

      if (formData.dob) {
        updateData.dob = formData.dob;
      }

      if (profilePictureUrl) {
        updateData.profile_picture_url = profilePictureUrl;
      }

      const result = await updateProfile(updateData);
      if (profilePictureUrl && !result?.profile_picture_url) {
        // Defensive: if DB did not persist for some reason
        toast({
          title: 'Saved with warning',
          description: 'Image uploaded but URL did not persist. Please retry saving.',
        });
      }
      await saveSocialLinks();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, {
      platform: 'linkedin',
      url: '',
      is_public: true
    }]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setSocialLinks(updatedLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateNotificationPreferences = (key: string, value: boolean) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [key]: value
    });
  };

  return {
    formData,
    socialLinks,
    notificationPreferences,
    isLoadingProfile,
    uploadingPicture,
    loadProfileData,
    updateUserProfile,
    deleteProfilePicture,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    updateFormData,
    updateNotificationPreferences
  };
}
