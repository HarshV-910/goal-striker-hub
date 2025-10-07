import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Clock, Save, Loader2 } from 'lucide-react';
import { z } from 'zod';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
  { value: 'America/Chicago', label: 'Central Time (UTC-6)' },
  { value: 'America/Denver', label: 'Mountain Time (UTC-7)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
];

const profileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  timezone: z.string().min(1, { message: "Please select a timezone" }),
});

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    timezone: 'UTC',
  });
  const [errors, setErrors] = useState<{ fullName?: string; timezone?: string }>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, timezone')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: data.full_name || '',
          timezone: data.timezone || 'UTC',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const validation = profileSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: { fullName?: string; timezone?: string } = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0] === 'fullName') {
          fieldErrors.fullName = error.message;
        } else if (error.path[0] === 'timezone') {
          fieldErrors.timezone = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
          timezone: formData.timezone,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                Your email address cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={errors.fullName ? 'border-destructive' : ''}
                maxLength={100}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timezone
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger id="timezone" className={errors.timezone ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-destructive">{errors.timezone}</p>
              )}
              <p className="text-sm text-muted-foreground">
                This will be used for scheduling and reminders
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Settings;
